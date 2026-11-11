import type { RpcClient } from '../mobile-tasks-dependencies'
import type {
  YunxiaoComment,
  YunxiaoConnectionStatus,
  YunxiaoStatus,
  YunxiaoWorkItem,
  YunxiaoWorkItemDetail
} from '../../../../src/shared/yunxiao/yunxiao-types'

// leniu: Yunxiao lives on the paired desktop (its token never reaches the phone).
async function call<T>(client: RpcClient, method: string, params?: unknown): Promise<T> {
  const response = await client.sendRequest(method, params)
  if (!response.ok) {
    throw new Error(response.error.message)
  }
  return response.result as T
}

export const mobileYunxiao = {
  status: (client: RpcClient) => call<YunxiaoConnectionStatus>(client, 'yunxiao.status'),
  list: (client: RpcClient) => call<YunxiaoWorkItem[]>(client, 'yunxiao.list', { filter: 'all' }),
  get: (client: RpcClient, ref: string) =>
    call<YunxiaoWorkItemDetail>(client, 'yunxiao.get', { ref }),
  comments: (client: RpcClient, ref: string) =>
    call<YunxiaoComment[]>(client, 'yunxiao.comments', { ref }),
  addComment: (client: RpcClient, ref: string, content: string) =>
    call<void>(client, 'yunxiao.addComment', { ref, content }),
  statuses: (client: RpcClient, ref: string) =>
    call<YunxiaoStatus[]>(client, 'yunxiao.statuses', { ref }),
  setStatus: (client: RpcClient, ref: string, status: string) =>
    call<YunxiaoWorkItemDetail>(client, 'yunxiao.setStatus', { ref, status })
}
