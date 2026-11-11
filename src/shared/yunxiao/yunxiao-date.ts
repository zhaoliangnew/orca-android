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
