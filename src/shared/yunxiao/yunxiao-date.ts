// Yunxiao keeps dates as Beijing midnights; the computer's own time zone may differ.
const BEIJING_OFFSET_MS = 8 * 60 * 60_000

/** YYYY-MM-DD of a moment on the Beijing calendar (Yunxiao's), default now. */
export function yunxiaoDateIso(ms: number = Date.now()): string {
  const date = new Date(ms + BEIJING_OFFSET_MS)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

/** Monday and Sunday (YYYY-MM-DD) of the Beijing week holding `ms`, default now. */
export function yunxiaoWeekRange(ms: number = Date.now()): { start: string; end: string } {
  const [year, month, day] = yunxiaoDateIso(ms).split('-').map(Number)
  const today = Date.UTC(year, month - 1, day)
  const sinceMonday = (new Date(today).getUTCDay() + 6) % 7
  const dayMs = 24 * 60 * 60_000
  const iso = (value: number): string => new Date(value).toISOString().slice(0, 10)
  return { start: iso(today - sinceMonday * dayMs), end: iso(today + (6 - sinceMonday) * dayMs) }
}

/** Whether a plan (either date may be missing) overlaps the week; undated work does not. */
export function isPlannedInWeek(
  plan: { startAt: string | null; dueAt: string | null },
  week: { start: string; end: string }
): boolean {
  const start = (plan.startAt ?? plan.dueAt)?.slice(0, 10)
  const end = (plan.dueAt ?? plan.startAt)?.slice(0, 10)
  return Boolean(start && end && start <= week.end && end >= week.start)
}

export type YunxiaoDueBadge = { label: string; tone: 'overdue' | 'soon' }

/** 逾期N天 / 今天到期 / 明天到期 / 还剩N天到期 for open work due within three days, like Yunxiao's list. */
export function yunxiaoDueBadge(
  dueAt: string | null,
  now: number = Date.now()
): YunxiaoDueBadge | null {
  const due = dueAt?.slice(0, 10)
  if (!due) {
    return null
  }
  const dayMs = 24 * 60 * 60_000
  const days = Math.round(
    (Date.parse(`${due}T00:00:00Z`) - Date.parse(`${yunxiaoDateIso(now)}T00:00:00Z`)) / dayMs
  )
  if (days < 0) {
    return { label: `逾期${-days}天`, tone: 'overdue' }
  }
  if (days > 3) {
    return null
  }
  return {
    label: days === 0 ? '今天到期' : days === 1 ? '明天到期' : `还剩${days}天到期`,
    tone: 'soon'
  }
}
