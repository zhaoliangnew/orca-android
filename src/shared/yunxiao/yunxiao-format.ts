import {
  yunxiaoCategoryLabel,
  type YunxiaoComment,
  type YunxiaoWorkItemDetail
} from './yunxiao-types'

function formatTime(ms: number): string {
  if (!ms) {
    return ''
  }
  const date = new Date(ms)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** A work item as plain text for an agent prompt or the CLI. */
export function formatYunxiaoWorkItemContext(
  item: YunxiaoWorkItemDetail,
  comments: readonly YunxiaoComment[] = [],
  plainDescription = item.description
): string {
  const lines = [
    `云效${yunxiaoCategoryLabel(item.category)} ${item.serialNumber}：${item.subject}`,
    `链接：${item.url}`,
    `项目：${item.space.name}　状态：${item.status.name}　负责人：${item.assignedTo?.name ?? '未指派'}`,
    ...(item.sprint ? [`迭代：${item.sprint.name}`] : []),
    ...(item.priority ? [`优先级：${item.priority}`] : []),
    ...(item.dueAt ? [`计划完成：${item.dueAt}`] : []),
    '',
    '描述：',
    plainDescription.trim() || '（无）'
  ]
  if (comments.length > 0) {
    lines.push('', '评论：')
    for (const comment of comments) {
      lines.push(
        `- ${comment.author?.name ?? '某人'}（${formatTime(comment.createdAt)}）：${comment.content.trim()}`
      )
    }
  }
  return lines.join('\n')
}
