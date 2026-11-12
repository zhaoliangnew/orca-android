import type { YunxiaoConnectionStatus, YunxiaoProject } from '../../shared/yunxiao/yunxiao-types'
import { YunxiaoApiError, projexPath, yunxiaoFetch } from './yunxiao-http'
import { mapUser } from './yunxiao-mapping'
import {
  clearYunxiaoConnection,
  readYunxiaoState,
  readYunxiaoToken,
  saveYunxiaoToken,
  updateYunxiaoState
} from './yunxiao-store'

type Raw = Record<string, unknown>
const SCAN_CONCURRENCY = 16

export function yunxiaoStatus(): YunxiaoConnectionStatus {
  const state = readYunxiaoState()
  let connected = false
  let error: string | undefined
  try {
    connected = Boolean(readYunxiaoToken()) && Boolean(state.organizationId)
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause)
  }
  return {
    connected,
    user: state.user,
    organizationId: state.organizationId,
    organizationName: state.organizationName,
    watchedProjects: state.watchedProjects,
    lastScannedAt: state.lastScannedAt,
    ...(error ? { error } : {})
  }
}

/** Checks the token against Yunxiao, then saves it with the user's organization. */
export async function yunxiaoConnect(
  token: string,
  organizationId?: string
): Promise<YunxiaoConnectionStatus> {
  const { body: me } = await yunxiaoFetch<Raw>('/oapi/v1/platform/user', { token })
  const user = mapUser(me)
  const orgId =
    organizationId || (typeof me.lastOrganization === 'string' ? me.lastOrganization : '')
  if (!user || !orgId) {
    throw new YunxiaoApiError('令牌无效，或这个账号没有加入任何云效企业。', 401)
  }
  const { body: orgs } = await yunxiaoFetch<Raw[]>('/oapi/v1/platform/organizations', { token })
  const org = (Array.isArray(orgs) ? orgs : []).find((entry) => entry.id === orgId)
  saveYunxiaoToken(token)
  const previous = readYunxiaoState()
  updateYunxiaoState((state) => ({
    ...state,
    organizationId: orgId,
    organizationName: typeof org?.name === 'string' ? org.name : null,
    user,
    // A different account or organization starts its watched list over.
    watchedProjects:
      previous.user?.id === user.id && previous.organizationId === orgId
        ? state.watchedProjects
        : []
  }))
  return yunxiaoStatus()
}

export function yunxiaoDisconnect(): YunxiaoConnectionStatus {
  clearYunxiaoConnection()
  return yunxiaoStatus()
}

async function searchProjects(extraConditions?: Raw): Promise<YunxiaoProject[]> {
  const projects: YunxiaoProject[] = []
  for (let page = 1; page <= 20; page++) {
    const { body, headers } = await yunxiaoFetch<Raw[]>(projexPath('/projects:search'), {
      method: 'POST',
      body: {
        ...(extraConditions ? { extraConditions: JSON.stringify(extraConditions) } : {}),
        page,
        perPage: 200,
        orderBy: 'gmtCreate',
        sort: 'desc'
      }
    })
    for (const raw of Array.isArray(body) ? body : []) {
      projects.push({
        id: String(raw.id ?? ''),
        name: String(raw.name ?? ''),
        customCode: String(raw.customCode ?? '')
      })
    }
    if (page >= Number(headers.get('x-total-pages') ?? 1)) {
      break
    }
  }
  return projects
}

/** Every project the user takes part in (Yunxiao pages at 200). */
export async function listParticipatedProjects(): Promise<YunxiaoProject[]> {
  const userId = readYunxiaoState().user?.id
  if (!userId) {
    throw new YunxiaoApiError('云效未连接。', 401)
  }
  return searchProjects({
    conditionGroups: [
      [
        {
          className: 'user',
          fieldIdentifier: 'users',
          format: 'multiList',
          operator: 'CONTAINS',
          value: [userId]
        }
      ]
    ]
  })
}

/**
 * Work can be assigned in projects the user is not a member of, so the scan covers every project
 * the token can see (public ones plus the user's own).
 */
async function listScannableProjects(): Promise<YunxiaoProject[]> {
  const [all, mine] = await Promise.all([searchProjects(), listParticipatedProjects()])
  const byId = new Map(all.map((project) => [project.id, project]))
  for (const project of mine) {
    byId.set(project.id, project)
  }
  return [...byId.values()]
}

async function countAssigned(projectId: string, userId: string): Promise<number> {
  const { headers } = await yunxiaoFetch<unknown>(projexPath('/workitems:search'), {
    method: 'POST',
    body: {
      category: 'Req,Task,Bug',
      spaceId: projectId,
      conditions: JSON.stringify({ conditionGroups: [[assignedCondition(userId)]] }),
      perPage: 1
    }
  })
  return Number(headers.get('x-total') ?? 0)
}

export function assignedCondition(userId: string): Raw {
  return {
    className: 'user',
    fieldIdentifier: 'assignedTo',
    format: 'list',
    operator: 'CONTAINS',
    toValue: null,
    value: [userId]
  }
}

/**
 * Yunxiao only searches one project at a time, so the page watches the projects that hold work
 * assigned to the user; this scan finds them.
 */
export async function scanWatchedProjects(): Promise<YunxiaoConnectionStatus> {
  const userId = readYunxiaoState().user?.id
  if (!userId) {
    throw new YunxiaoApiError('云效未连接。', 401)
  }
  const projects = await listScannableProjects()
  const watched: YunxiaoProject[] = []
  for (let index = 0; index < projects.length; index += SCAN_CONCURRENCY) {
    const batch = projects.slice(index, index + SCAN_CONCURRENCY)
    const counts = await Promise.all(
      batch.map((project) => countAssigned(project.id, userId).catch(() => 0))
    )
    batch.forEach((project, offset) => {
      if (counts[offset] > 0) {
        watched.push(project)
      }
    })
  }
  updateYunxiaoState((state) => ({ ...state, watchedProjects: watched, lastScannedAt: Date.now() }))
  return yunxiaoStatus()
}

export async function setWatchedProjects(projectIds: string[]): Promise<YunxiaoConnectionStatus> {
  const wanted = new Set(projectIds)
  const projects = (await listParticipatedProjects()).filter((project) => wanted.has(project.id))
  updateYunxiaoState((state) => ({ ...state, watchedProjects: projects }))
  return yunxiaoStatus()
}
