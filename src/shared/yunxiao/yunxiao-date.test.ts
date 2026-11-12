import { describe, expect, it } from 'vitest'
import { isPlannedInWeek, yunxiaoDateIso, yunxiaoDueBadge, yunxiaoWeekRange } from './yunxiao-date'

describe('yunxiao dates', () => {
  it('reads moments on the Beijing calendar', () => {
    // 2026-11-10T16:00Z is midnight of 11-11 in Beijing.
    expect(yunxiaoDateIso(Date.UTC(2026, 10, 10, 16))).toBe('2026-11-11')
    expect(yunxiaoDateIso(Date.UTC(2026, 10, 10, 15, 59))).toBe('2026-11-10')
  })

  it('spans Monday to Sunday', () => {
    // Wednesday 2026-11-11 (Beijing).
    expect(yunxiaoWeekRange(Date.UTC(2026, 10, 11, 4))).toEqual({
      start: '2026-11-09',
      end: '2026-11-15'
    })
    // Sunday stays in its own week.
    expect(yunxiaoWeekRange(Date.UTC(2026, 10, 15, 4)).start).toBe('2026-11-09')
  })

  it('counts plans that touch the week', () => {
    const week = { start: '2026-11-09', end: '2026-11-15' }
    expect(isPlannedInWeek({ startAt: null, dueAt: '2026-11-13 23:59:59' }, week)).toBe(true)
    expect(isPlannedInWeek({ startAt: '2026-11-01 00:00:00', dueAt: '2026-11-20' }, week)).toBe(
      true
    )
    expect(isPlannedInWeek({ startAt: '2026-11-16', dueAt: null }, week)).toBe(false)
    expect(isPlannedInWeek({ startAt: null, dueAt: null }, week)).toBe(false)
  })

  it('words due dates like Yunxiao', () => {
    const now = Date.UTC(2026, 10, 11, 4)
    expect(yunxiaoDueBadge('2026-11-10 23:59:59', now)).toEqual({
      label: '逾期1天',
      tone: 'overdue'
    })
    expect(yunxiaoDueBadge('2026-11-11', now)?.label).toBe('今天到期')
    expect(yunxiaoDueBadge('2026-11-12', now)?.label).toBe('明天到期')
    expect(yunxiaoDueBadge('2026-11-13', now)?.label).toBe('还剩2天到期')
    expect(yunxiaoDueBadge('2026-11-20', now)).toBeNull()
    expect(yunxiaoDueBadge(null, now)).toBeNull()
  })
})
