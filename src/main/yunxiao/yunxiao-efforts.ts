import type { YunxiaoEffortRecord, YunxiaoEfforts } from '../../shared/yunxiao/yunxiao-types'
import { yunxiaoDateIso } from '../../shared/yunxiao/yunxiao-date'
import { YunxiaoApiError, projexPath, yunxiaoFetch } from './yunxiao-http'
import { mapUser } from './yunxiao-mapping'
import { readYunxiaoState } from './yunxiao-store'
import { getWorkItem } from './yunxiao-work-items'

type Raw = Record<string, unknown>

function toDate(ms: unknown): string {
  return typeof ms === 'number' && ms ? yunxiaoDateIso(ms) : ''
}

/** leniu: 预计工时 and 登记的实际工时 of a work item (Yunxiao sums them into its 工时 fields). */
export async function listEfforts(ref: string): Promise<YunxiaoEfforts> {
  const item = await getWorkItem(ref)
  const [estimated, records] = await Promise.all([
    yunxiaoFetch<Raw[]>(projexPath(`/workitems/${item.id}/estimatedEfforts`)),
    yunxiaoFetch<Raw[]>(projexPath(`/workitems/${item.id}/effortRecords`))
  ])
  return {
    estimated: (Array.isArray(estimated.body) ? estimated.body : []).map((entry) => ({
      id: String(entry.id ?? ''),
      hours: Number(entry.spentTime ?? 0),
      owner: mapUser(entry.owner)
    })),
    records: (Array.isArray(records.body) ? records.body : [])
      .map((entry): YunxiaoEffortRecord => ({
        id: String(entry.id ?? ''),
        hours: Number(entry.actualTime ?? 0),
        date: toDate(entry.gmtStart),
        description: typeof entry.description === 'string' ? entry.description : '',
        owner: mapUser(entry.owner)
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }
}

/** Sets the user's 预计工时: updates their estimate when there is one, else adds it. */
export async function setEstimate(ref: string, hours: number): Promise<YunxiaoEfforts> {
  const userId = readYunxiaoState().user?.id
  if (!userId) {
    throw new YunxiaoApiError('云效未连接。', 401)
  }
  const item = await getWorkItem(ref)
  const current = (await listEfforts(item.id)).estimated.find((entry) => entry.owner?.id === userId)
  const body = { spentTime: hours, owner: userId }
  await yunxiaoFetch(
    projexPath(
      current
        ? `/workitems/${item.id}/estimatedEfforts/${current.id}`
        : `/workitems/${item.id}/estimatedEfforts`
    ),
    { method: current ? 'PUT' : 'POST', body }
  )
  return listEfforts(item.id)
}

/** 登记工时: one day's actual hours on the work item. */
export async function addEffortRecord(
  ref: string,
  entry: { hours: number; date: string; description?: string }
): Promise<YunxiaoEfforts> {
  const item = await getWorkItem(ref)
  await yunxiaoFetch(projexPath(`/workitems/${item.id}/effortRecords`), {
    method: 'POST',
    body: {
      actualTime: entry.hours,
      gmtStart: entry.date,
      gmtEnd: entry.date,
      ...(entry.description?.trim() ? { description: entry.description.trim().slice(0, 500) } : {})
    }
  })
  return listEfforts(item.id)
}
