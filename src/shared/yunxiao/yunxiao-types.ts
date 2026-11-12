/** leniu: Alibaba Cloud Yunxiao (云效) work items, as Orca's Yunxiao page and CLI read them. */

export type YunxiaoUser = { id: string; name: string }

export type YunxiaoCategory = 'Req' | 'Task' | 'Bug'

export const YUNXIAO_CATEGORIES: readonly YunxiaoCategory[] = ['Req', 'Task', 'Bug']

export type YunxiaoStatus = { id: string; name: string }

export type YunxiaoWorkItem = {
  id: string
  /** Human key shown in Yunxiao, e.g. YOEZ-540. */
  serialNumber: string
  subject: string
  category: string
  typeId: string
  typeName: string
  status: YunxiaoStatus
  /** Yunxiao status stage: 1 to do, 2 doing, 3 fixed, 11 dev done/提测, 4 done, 5 cancelled. */
  statusStage: string
  assignedTo: YunxiaoUser | null
  creator: YunxiaoUser | null
  space: { id: string; name: string }
  sprint: { id: string; name: string } | null
  parentId: string | null
  priority: string | null
  /** 计划开始时间 / 计划完成时间, as Yunxiao formats them (YYYY-MM-DD HH:mm:ss). */
  startAt: string | null
  dueAt: string | null
  /** 预计/实际工时汇总 (hours), as Yunxiao sums its effort records. */
  estimateHours: number | null
  actualHours: number | null
  createdAt: number
  updatedAt: number
  url: string
}

export type YunxiaoWorkItemDetail = YunxiaoWorkItem & {
  description: string
  trackers: YunxiaoUser[]
}

export type YunxiaoComment = {
  id: string
  content: string
  author: YunxiaoUser | null
  createdAt: number
}

export type YunxiaoProject = { id: string; name: string; customCode: string }

export type YunxiaoSprint = { id: string; name: string; status: string }

export type YunxiaoConnectionStatus = {
  connected: boolean
  user: YunxiaoUser | null
  organizationId: string | null
  organizationName: string | null
  /** Projects whose work items the page lists (Yunxiao search is per project). */
  watchedProjects: YunxiaoProject[]
  /** When the watched projects were last found (ms); 0 before the first scan. */
  lastScannedAt: number
  error?: string
}

export type YunxiaoListFilter = 'open' | 'done' | 'all'

export type YunxiaoWorkspaceLink = {
  worktreeId: string
  workItemId: string
  serialNumber: string
  subject: string
  url: string
}

/** Stages that close a work item: done/closed (4) and cancelled (5). */
export const YUNXIAO_CLOSED_STAGES = ['4', '5']
/** Every other stage, 开发完成/已提测 (11) included: they still need follow-up. */
export const YUNXIAO_OPEN_STAGES = ['1', '2', '3', '11']

export function isYunxiaoDone(item: Pick<YunxiaoWorkItem, 'statusStage'>): boolean {
  return YUNXIAO_CLOSED_STAGES.includes(item.statusStage)
}

export function yunxiaoCategoryLabel(category: string): string {
  return category === 'Req'
    ? '需求'
    : category === 'Task'
      ? '任务'
      : category === 'Bug'
        ? '缺陷'
        : category
}

/** Web link of a work item, by its serial number (devops.aliyun.com resolves req/task/bug). */
export function yunxiaoWorkItemUrl(category: string, serialNumber: string): string {
  const kind = category === 'Req' ? 'req' : category === 'Bug' ? 'bug' : 'task'
  return `https://devops.aliyun.com/projex/${kind}/${encodeURIComponent(serialNumber)}`
}

export type YunxiaoEffortRecord = {
  id: string
  hours: number
  /** YYYY-MM-DD of the work. */
  date: string
  description: string
  owner: YunxiaoUser | null
}

export type YunxiaoEfforts = {
  /** 预计工时 records (normally one per person). */
  estimated: { id: string; hours: number; owner: YunxiaoUser | null }[]
  /** 实际工时: every 登记工时 entry. */
  records: YunxiaoEffortRecord[]
}
