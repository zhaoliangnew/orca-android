import { callRuntimeRpc } from '../rpc/calls/runtime-rpc-call'
import type {
  YunxiaoComment,
  YunxiaoConnectionStatus,
  YunxiaoEfforts,
  YunxiaoListFilter,
  YunxiaoProject,
  YunxiaoSprint,
  YunxiaoStatus,
  YunxiaoUser,
  YunxiaoWorkItem,
  YunxiaoWorkItemDetail,
  YunxiaoWorkspaceLink
} from '../../../../shared/yunxiao/yunxiao-types'

// leniu: Yunxiao lives on this machine (its token never leaves it), so calls go to the local runtime.
const LOCAL = { kind: 'local' } as const
const call = <T>(method: string, params?: unknown, timeoutMs = 30_000): Promise<T> =>
  callRuntimeRpc<T>(LOCAL, method, params, { timeoutMs })

export const yunxiaoClient = {
  status: () => call<YunxiaoConnectionStatus>('yunxiao.status'),
  connect: (token: string) => call<YunxiaoConnectionStatus>('yunxiao.connect', { token }),
  disconnect: () => call<YunxiaoConnectionStatus>('yunxiao.disconnect'),
  projects: () => call<YunxiaoProject[]>('yunxiao.projects'),
  // One request per participated project: give a large organization time.
  scanProjects: () => call<YunxiaoConnectionStatus>('yunxiao.scanProjects', undefined, 180_000),
  watchProjects: (projectIds: string[]) =>
    call<YunxiaoConnectionStatus>('yunxiao.watchProjects', { projectIds }),
  list: (params: {
    filter?: YunxiaoListFilter
    category?: 'Req' | 'Task' | 'Bug'
    projectId?: string
    keyword?: string
  }) => call<YunxiaoWorkItem[]>('yunxiao.list', params, 60_000),
  get: (ref: string) => call<YunxiaoWorkItemDetail>('yunxiao.get', { ref }),
  context: (ref: string) => call<string>('yunxiao.context', { ref }),
  comments: (ref: string) => call<YunxiaoComment[]>('yunxiao.comments', { ref }),
  addComment: (ref: string, content: string) => call<void>('yunxiao.addComment', { ref, content }),
  statuses: (ref: string) => call<YunxiaoStatus[]>('yunxiao.statuses', { ref }),
  setStatus: (ref: string, status: string) =>
    call<YunxiaoWorkItemDetail>('yunxiao.setStatus', { ref, status }),
  setPlanDates: (ref: string, dates: { start?: string; due?: string }) =>
    call<YunxiaoWorkItemDetail>('yunxiao.setPlanDates', { ref, ...dates }),
  efforts: (ref: string) => call<YunxiaoEfforts>('yunxiao.efforts', { ref }),
  setEstimate: (ref: string, hours: number) =>
    call<YunxiaoEfforts>('yunxiao.setEstimate', { ref, hours }),
  addEffort: (ref: string, entry: { hours: number; date: string; description?: string }) =>
    call<YunxiaoEfforts>('yunxiao.addEffort', { ref, ...entry }),
  sprints: (projectId: string) => call<YunxiaoSprint[]>('yunxiao.sprints', { projectId }),
  create: (params: {
    projectId: string
    category: 'Req' | 'Task' | 'Bug'
    subject: string
    description?: string
    sprintId?: string
  }) => call<YunxiaoWorkItemDetail>('yunxiao.create', params),
  submitTest: (ref: string, note?: string) =>
    call<{
      task: YunxiaoWorkItemDetail
      owner: YunxiaoUser | null
      notified: boolean
      notifyError?: string
    }>('yunxiao.submitTest', { ref, note }, 90_000),
  links: () => call<YunxiaoWorkspaceLink[]>('yunxiao.links'),
  linkWorkspace: (worktreeId: string, ref?: string) =>
    call<YunxiaoWorkspaceLink[]>('yunxiao.linkWorkspace', { worktreeId, ref })
}
