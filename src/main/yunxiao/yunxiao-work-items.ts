import type {
  YunxiaoComment,
  YunxiaoListFilter,
  YunxiaoSprint,
  YunxiaoStatus,
  YunxiaoWorkItem,
  YunxiaoWorkItemDetail
} from '../../shared/yunxiao/yunxiao-types'
import { YUNXIAO_CLOSED_STAGES, YUNXIAO_OPEN_STAGES } from '../../shared/yunxiao/yunxiao-types'
import { assignedCondition } from './yunxiao-connection'
import { YunxiaoApiError, projexPath, yunxiaoFetch } from './yunxiao-http'
import { mapComment, mapWorkItem, mapWorkItemDetail } from './yunxiao-mapping'
import { readYunxiaoState } from './yunxiao-store'

type Raw = Record<string, unknown>
// The page pages locally; done/all lists keep the most recent this many.
const DEFAULT_LIMIT = 1000
const PROJECT_CONCURRENCY = 16

export type YunxiaoListOptions = {
  filter?: YunxiaoListFilter
  category?: 'Req' | 'Task' | 'Bug'
  projectId?: string
  keyword?: string
  limit?: number
}

function listCondition(field: string, className: string, values: string[]): Raw {
  return {
    className,
    fieldIdentifier: field,
    format: 'list',
    operator: 'CONTAINS',
    toValue: null,
    value: values
  }
}

async function searchProject(
  projectId: string,
  userId: string,
  options: YunxiaoListOptions,
  perPage: number
): Promise<YunxiaoWorkItem[]> {
  const conditions: Raw[] = [assignedCondition(userId)]
  const filter = options.filter ?? 'open'
  if (filter !== 'all') {
    conditions.push(
      listCondition(
        'statusStage',
        'statusStage',
        filter === 'open' ? YUNXIAO_OPEN_STAGES : YUNXIAO_CLOSED_STAGES
      )
    )
  }
  if (options.keyword?.trim()) {
    conditions.push({
      className: 'string',
      fieldIdentifier: 'subject',
      format: 'input',
      operator: 'CONTAINS',
      toValue: null,
      value: [options.keyword.trim()]
    })
  }
  const { body } = await yunxiaoFetch<Raw[]>(projexPath('/workitems:search'), {
    method: 'POST',
    body: {
      category: options.category ?? 'Req,Task,Bug',
      spaceId: projectId,
      conditions: JSON.stringify({ conditionGroups: [conditions] }),
      orderBy: 'gmtModified',
      sort: 'desc',
      perPage
    }
  })
  return (Array.isArray(body) ? body : []).map(mapWorkItem)
}

/** Work assigned to the user across the watched projects, newest change first. */
export async function listMyWorkItems(
  options: YunxiaoListOptions = {}
): Promise<YunxiaoWorkItem[]> {
  const state = readYunxiaoState()
  const userId = state.user?.id
  if (!userId) {
    throw new YunxiaoApiError('云效未连接。', 401)
  }
  const limit = Math.min(options.limit || DEFAULT_LIMIT, DEFAULT_LIMIT)
  const projectIds = options.projectId
    ? [options.projectId]
    : state.watchedProjects.map((project) => project.id)
  // Yunxiao caps a page at 200: per project that is plenty for one person's work.
  const perPage = Math.min(limit, 200)
  const items: YunxiaoWorkItem[] = []
  for (let index = 0; index < projectIds.length; index += PROJECT_CONCURRENCY) {
    const batch = projectIds.slice(index, index + PROJECT_CONCURRENCY)
    const results = await Promise.all(
      batch.map((id) => searchProject(id, userId, options, perPage))
    )
    items.push(...results.flat())
  }
  return items.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit)
}

/** By id or by serial number (YOEZ-540); Yunxiao resolves both. */
export async function getWorkItem(ref: string): Promise<YunxiaoWorkItemDetail> {
  const { body } = await yunxiaoFetch<Raw>(
    projexPath(`/workitems/${encodeURIComponent(ref.trim())}`)
  )
  if (!body || typeof body !== 'object' || !body.id) {
    throw new YunxiaoApiError(`找不到工作项 ${ref}`, 404)
  }
  return mapWorkItemDetail(body)
}

export async function listComments(ref: string): Promise<YunxiaoComment[]> {
  const item = await getWorkItem(ref)
  const { body } = await yunxiaoFetch<Raw[]>(
    projexPath(`/workitems/${item.id}/comments?page=1&perPage=100`)
  )
  return (Array.isArray(body) ? body : []).map(mapComment)
}

export async function addComment(ref: string, content: string): Promise<void> {
  const item = await getWorkItem(ref)
  await yunxiaoFetch(projexPath(`/workitems/${item.id}/comments`), {
    method: 'POST',
    body: { content, formatType: 'MARKDOWN' }
  })
}

export async function listStatuses(
  item: Pick<YunxiaoWorkItem, 'space' | 'typeId'>
): Promise<YunxiaoStatus[]> {
  const { body } = await yunxiaoFetch<Raw>(
    projexPath(`/projects/${item.space.id}/workitemTypes/${item.typeId}/workflows`)
  )
  const statuses = Array.isArray(body?.statuses) ? (body.statuses as Raw[]) : []
  return statuses.map((status) => ({
    id: String(status.id ?? ''),
    name: String(status.displayName ?? status.name ?? '')
  }))
}

/** Moves a work item to a status given by id or by name (处理中, 已提测...). */
export async function setStatus(ref: string, status: string): Promise<YunxiaoWorkItemDetail> {
  const item = await getWorkItem(ref)
  const statuses = await listStatuses(item)
  const wanted = status.trim()
  const match = statuses.find((entry) => entry.id === wanted || entry.name === wanted)
  if (!match) {
    throw new YunxiaoApiError(
      `没有「${wanted}」这个状态，可选：${statuses.map((entry) => entry.name).join('、')}`,
      400
    )
  }
  await yunxiaoFetch(projexPath(`/workitems/${item.id}`), {
    method: 'PUT',
    body: { status: match.id }
  })
  return getWorkItem(item.id)
}

export async function listSprints(projectId: string): Promise<YunxiaoSprint[]> {
  const { body } = await yunxiaoFetch<Raw[]>(
    projexPath(`/projects/${projectId}/sprints?status=TODO,DOING&perPage=50`)
  )
  return (Array.isArray(body) ? body : []).map((sprint) => ({
    id: String(sprint.id ?? ''),
    name: String(sprint.name ?? ''),
    status: String(sprint.status ?? '')
  }))
}

const PLAN_FIELDS = { start: '计划开始时间', due: '计划完成时间' } as const

/** 计划开始/完成时间 are custom fields: find their ids for this project and type, then set them. */
export async function setPlanDates(
  ref: string,
  dates: { start?: string; due?: string }
): Promise<YunxiaoWorkItemDetail> {
  const item = await getWorkItem(ref)
  const { body } = await yunxiaoFetch<Raw[]>(
    projexPath(`/projects/${item.space.id}/workitemTypes/${item.typeId}/fields`)
  )
  const fields = Array.isArray(body) ? body : []
  const fieldId = (name: string): string => {
    const field = fields.find((entry) => entry.name === name)
    if (!field?.id) {
      throw new YunxiaoApiError(`这个工作项类型没有「${name}」字段。`, 400)
    }
    return String(field.id)
  }
  const update: Raw = {}
  if (dates.start) {
    update[fieldId(PLAN_FIELDS.start)] = `${dates.start} 00:00:00`
  }
  if (dates.due) {
    update[fieldId(PLAN_FIELDS.due)] = `${dates.due} 23:59:59`
  }
  if (Object.keys(update).length > 0) {
    await yunxiaoFetch(projexPath(`/workitems/${item.id}`), { method: 'PUT', body: update })
  }
  return getWorkItem(item.id)
}
