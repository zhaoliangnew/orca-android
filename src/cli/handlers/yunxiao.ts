import {
  yunxiaoCategoryLabel,
  type YunxiaoConnectionStatus,
  type YunxiaoEfforts,
  type YunxiaoStatus,
  type YunxiaoWorkItem,
  type YunxiaoWorkItemDetail,
  type YunxiaoWorkspaceLink
} from '../../shared/yunxiao/yunxiao-types'
import { yunxiaoDateIso } from '../../shared/yunxiao/yunxiao-date'
import type { CommandHandler, HandlerContext } from '../dispatch'
import {
  getOptionalPositiveIntegerFlag,
  getOptionalStringFlag,
  getRequiredStringFlag
} from '../flags'
import { printResult } from '../format'
import { RuntimeClientError } from '../runtime-client'
import { resolveCurrentWorktreeSelection } from '../selectors'

function formatItemRow(item: YunxiaoWorkItem): string {
  return `${item.serialNumber}  [${yunxiaoCategoryLabel(item.category)}·${item.status.name}]  ${item.subject}  (${item.space.name})`
}

async function resolveRef(context: HandlerContext): Promise<string> {
  const ref = getOptionalStringFlag(context.flags, 'ref')
  if (ref) {
    return ref
  }
  if (context.flags.get('current') !== true) {
    throw new RuntimeClientError('invalid_argument', 'Pass a work item id/serial or --current.')
  }
  const { worktreeId } = await resolveCurrentWorktreeSelection(context.cwd, context.client)
  const links = (await context.client.call<YunxiaoWorkspaceLink[]>('yunxiao.links')).result
  const link = links.find((entry) => entry.worktreeId === worktreeId)
  if (!link) {
    throw new RuntimeClientError(
      'selector_not_found',
      'This workspace is not linked to a Yunxiao work item.'
    )
  }
  return link.workItemId
}

function parseCategory(value: string | undefined): 'Req' | 'Task' | 'Bug' | undefined {
  if (value === undefined || value === 'Req' || value === 'Task' || value === 'Bug') {
    return value
  }
  throw new RuntimeClientError('invalid_argument', '--category must be Req, Task or Bug.')
}

export const YUNXIAO_HANDLERS: Record<string, CommandHandler> = {
  'yunxiao connection': async (context) => {
    const response = await context.client.call<YunxiaoConnectionStatus>('yunxiao.status')
    printResult(response, context.json, (status) =>
      status.connected
        ? `已连接：${status.user?.name ?? ''} @ ${status.organizationName ?? status.organizationId}\n关注的项目：${status.watchedProjects.map((project) => project.name).join('、') || '（无）'}`
        : '云效未连接。在 Orca 任务页的云效里填写个人访问令牌。'
    )
  },
  'yunxiao list': async (context) => {
    const filter = getOptionalStringFlag(context.flags, 'filter')
    if (filter && filter !== 'open' && filter !== 'done' && filter !== 'all') {
      throw new RuntimeClientError('invalid_argument', '--filter must be open, done or all.')
    }
    const response = await context.client.call<YunxiaoWorkItem[]>('yunxiao.list', {
      filter,
      category: parseCategory(getOptionalStringFlag(context.flags, 'category')),
      projectId: getOptionalStringFlag(context.flags, 'project'),
      keyword: getOptionalStringFlag(context.flags, 'search'),
      limit: getOptionalPositiveIntegerFlag(context.flags, 'limit')
    })
    printResult(response, context.json, (items) =>
      items.length > 0 ? items.map(formatItemRow).join('\n') : '没有符合条件的工作项。'
    )
  },
  'yunxiao show': async (context) => {
    const ref = await resolveRef(context)
    if (context.json) {
      printResult(await context.client.call('yunxiao.get', { ref }), true, () => '')
      return
    }
    const response = await context.client.call<string>('yunxiao.context', { ref })
    printResult(response, false, (text) => text)
  },
  'yunxiao comment': async (context) => {
    const ref = await resolveRef(context)
    const content = getRequiredStringFlag(context.flags, 'body')
    const response = await context.client.call('yunxiao.addComment', { ref, content })
    printResult(response, context.json, () => '已评论。')
  },
  'yunxiao status list': async (context) => {
    const ref = await resolveRef(context)
    const response = await context.client.call<YunxiaoStatus[]>('yunxiao.statuses', { ref })
    printResult(response, context.json, (statuses) =>
      statuses.map((status) => `${status.name}  (${status.id})`).join('\n')
    )
  },
  'yunxiao status set': async (context) => {
    const ref = await resolveRef(context)
    const status = getRequiredStringFlag(context.flags, 'to')
    const response = await context.client.call<YunxiaoWorkItemDetail>('yunxiao.setStatus', {
      ref,
      status
    })
    printResult(response, context.json, (item) => `${item.serialNumber} → ${item.status.name}`)
  },
  'yunxiao create': async (context) => {
    const category = parseCategory(getRequiredStringFlag(context.flags, 'category'))
    const response = await context.client.call<YunxiaoWorkItemDetail>('yunxiao.create', {
      projectId: getRequiredStringFlag(context.flags, 'project'),
      category,
      subject: getRequiredStringFlag(context.flags, 'title'),
      description: getOptionalStringFlag(context.flags, 'body'),
      parentId: getOptionalStringFlag(context.flags, 'parent'),
      sprintId: getOptionalStringFlag(context.flags, 'sprint')
    })
    printResult(response, context.json, (item) => `已创建 ${item.serialNumber}：${item.url}`)
  },
  'yunxiao submit-test': async (context) => {
    const ref = await resolveRef(context)
    const response = await context.client.call<{
      task: YunxiaoWorkItemDetail
      owner: { name: string } | null
      notified: boolean
      notifyError?: string
    }>('yunxiao.submitTest', { ref, note: getOptionalStringFlag(context.flags, 'note') })
    printResult(response, context.json, (result) =>
      [
        `已建提测单 ${result.task.serialNumber}：${result.task.url}`,
        result.notified
          ? `已钉钉通知 ${result.owner?.name}`
          : `未发钉钉：${result.notifyError ?? ''}`
      ].join('\n')
    )
  },
  'yunxiao effort list': async (context) => {
    const ref = await resolveRef(context)
    const response = await context.client.call<YunxiaoEfforts>('yunxiao.efforts', { ref })
    printResult(response, context.json, formatEfforts)
  },
  'yunxiao effort add': async (context) => {
    const ref = await resolveRef(context)
    const response = await context.client.call<YunxiaoEfforts>('yunxiao.addEffort', {
      ref,
      hours: parseHours(context),
      date: getOptionalStringFlag(context.flags, 'date') ?? yunxiaoDateIso(),
      description: getOptionalStringFlag(context.flags, 'note')
    })
    printResult(response, context.json, formatEfforts)
  },
  'yunxiao effort estimate': async (context) => {
    const ref = await resolveRef(context)
    const response = await context.client.call<YunxiaoEfforts>('yunxiao.setEstimate', {
      ref,
      hours: parseHours(context)
    })
    printResult(response, context.json, formatEfforts)
  }
}

function parseHours(context: HandlerContext): number {
  const hours = Number(getRequiredStringFlag(context.flags, 'hours'))
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new RuntimeClientError('invalid_argument', '--hours must be a positive number.')
  }
  return hours
}

function formatEfforts(efforts: YunxiaoEfforts): string {
  const estimated = efforts.estimated.map((entry) => `${entry.owner?.name ?? ''} ${entry.hours}h`)
  const records = efforts.records.map(
    (entry) => `${entry.date}  ${entry.hours}h  ${entry.owner?.name ?? ''}  ${entry.description}`
  )
  return [
    `预计：${estimated.join('，') || '（无）'}`,
    '已登记：',
    ...(records.length ? records : ['（无）'])
  ].join('\n')
}
