import { readYunxiaoState, readYunxiaoToken } from './yunxiao-store'

const API_BASE = 'https://openapi-rdc.aliyuncs.com'
const TIMEOUT_MS = 20_000

export class YunxiaoApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'YunxiaoApiError'
  }
}

export type YunxiaoResponse<T> = { body: T; headers: Headers }

/** One OpenAPI call with the saved (or a candidate) token; Yunxiao errors become readable text. */
export async function yunxiaoFetch<T>(
  path: string,
  init: { method?: string; body?: unknown; token?: string } = {}
): Promise<YunxiaoResponse<T>> {
  const token = init.token ?? readYunxiaoToken()
  if (!token) {
    throw new YunxiaoApiError('云效未连接，请先在云效页面填写个人访问令牌。', 401)
  }
  const response = await fetch(`${API_BASE}${path}`, {
    method: init.method ?? 'GET',
    headers: { 'x-yunxiao-token': token, 'Content-Type': 'application/json' },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  })
  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!response.ok) {
    const record = (body ?? {}) as Record<string, unknown>
    const message =
      (typeof record.errorMessage === 'string' && record.errorMessage) ||
      (typeof record.errorMsg === 'string' && record.errorMsg) ||
      `云效请求失败（${response.status}）`
    throw new YunxiaoApiError(message, response.status)
  }
  return { body: body as T, headers: response.headers }
}

/** Organization-scoped projex path; needs a connected organization. */
export function projexPath(suffix: string): string {
  const { organizationId } = readYunxiaoState()
  if (!organizationId) {
    throw new YunxiaoApiError('云效未连接，请先在云效页面填写个人访问令牌。', 401)
  }
  return `/oapi/v1/projex/organizations/${organizationId}${suffix}`
}
