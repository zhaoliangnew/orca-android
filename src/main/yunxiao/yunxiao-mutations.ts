import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type {
  YunxiaoUser,
  YunxiaoWorkItemDetail,
  YunxiaoWorkspaceLink
} from '../../shared/yunxiao/yunxiao-types'
import { YunxiaoApiError, projexPath, yunxiaoFetch } from './yunxiao-http'
import { readYunxiaoState, updateYunxiaoState } from './yunxiao-store'
import { getWorkItem } from './yunxiao-work-items'

type Raw = Record<string, unknown>

export type YunxiaoCreateOptions = {
  projectId: string
  category: 'Req' | 'Task' | 'Bug'
  subject: string
  description?: string
  parentId?: string
  sprintId?: string
  /** User id; defaults to the connected user. */
  assignedTo?: string
}

async function defaultTypeId(projectId: string, category: string): Promise<string> {
  const { body } = await yunxiaoFetch<Raw[]>(
    projexPath(`/projects/${projectId}/workitemTypes?category=${encodeURIComponent(category)}`)
  )
  const types = Array.isArray(body) ? body : []
  const chosen = types.find((type) => type.defaultType === true) ?? types[0]
  if (!chosen?.id) {
    throw new YunxiaoApiError('这个项目没有可用的工作项类型。', 400)
  }
  return String(chosen.id)
}

export async function createWorkItem(
  options: YunxiaoCreateOptions
): Promise<YunxiaoWorkItemDetail> {
  const assignedTo = options.assignedTo || readYunxiaoState().user?.id
  if (!assignedTo) {
    throw new YunxiaoApiError('云效未连接。', 401)
  }
  const { body } = await yunxiaoFetch<Raw>(projexPath('/workitems'), {
    method: 'POST',
    body: {
      spaceId: options.projectId,
      subject: options.subject,
      workitemTypeId: await defaultTypeId(options.projectId, options.category),
      assignedTo,
      ...(options.description ? { description: options.description, formatType: 'MARKDOWN' } : {}),
      ...(options.parentId ? { parentId: options.parentId } : {}),
      ...(options.sprintId ? { sprint: options.sprintId } : {})
    }
  })
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) {
    throw new YunxiaoApiError('云效没有返回新建的工作项。', 500)
  }
  return getWorkItem(id)
}

export type YunxiaoSubmitTestResult = {
  task: YunxiaoWorkItemDetail
  owner: YunxiaoUser | null
  notified: boolean
  notifyError?: string
}

const DINGTALK_SCRIPT = join(homedir(), '.claude', 'skills', 'dt', 'scripts', 'send.py')

function sendDingTalk(name: string, text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      'python3',
      [DINGTALK_SCRIPT, name, text],
      { timeout: 60_000 },
      (error, _out, stderr) =>
        error ? reject(new Error(stderr.trim() || error.message)) : resolve()
    )
  })
}

/**
 * 提测: a 任务 titled 提测：<需求> under the requirement, in its sprint, assigned to the user; then
 * the requirement's owner hears about it on DingTalk when the dt skill is installed.
 */
export async function submitTest(ref: string, note?: string): Promise<YunxiaoSubmitTestResult> {
  const requirement = await getWorkItem(ref)
  const task = await createWorkItem({
    projectId: requirement.space.id,
    category: 'Task',
    subject: `提测：${requirement.subject}`,
    ...(note?.trim() ? { description: note.trim() } : {}),
    parentId: requirement.id,
    ...(requirement.sprint ? { sprintId: requirement.sprint.id } : {})
  })
  const owner = requirement.assignedTo
  const me = readYunxiaoState().user
  if (!owner || owner.id === me?.id) {
    return { task, owner, notified: false, notifyError: '需求负责人是自己，没有发钉钉。' }
  }
  if (!existsSync(DINGTALK_SCRIPT)) {
    return { task, owner, notified: false, notifyError: '本机没有钉钉发送脚本（dt 技能）。' }
  }
  const message = [`提测：${requirement.subject}`, task.url, note?.trim()]
    .filter(Boolean)
    .join('\n')
  try {
    await sendDingTalk(owner.name, message)
    return { task, owner, notified: true }
  } catch (error) {
    return {
      task,
      owner,
      notified: false,
      notifyError: error instanceof Error ? error.message : String(error)
    }
  }
}

export function listWorkspaceLinks(): YunxiaoWorkspaceLink[] {
  return readYunxiaoState().links
}

/** Ties a workspace to a work item (the sidebar badge and `orca yunxiao current` read it). */
export async function linkWorkspace(
  worktreeId: string,
  ref: string | undefined
): Promise<YunxiaoWorkspaceLink[]> {
  const item = ref ? await getWorkItem(ref) : null
  return updateYunxiaoState((state) => ({
    ...state,
    links: [
      ...state.links.filter((link) => link.worktreeId !== worktreeId),
      ...(item
        ? [
            {
              worktreeId,
              workItemId: item.id,
              serialNumber: item.serialNumber,
              subject: item.subject,
              url: item.url
            }
          ]
        : [])
    ]
  })).links
}
