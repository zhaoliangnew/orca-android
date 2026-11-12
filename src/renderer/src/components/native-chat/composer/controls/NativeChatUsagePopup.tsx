import { useAppStore } from '@/store'
import { useResetCountdownClock } from '@/hooks/useResetCountdownClock'
import { clampUsedPercent } from '@/components/status-bar/tooltip'
import type { RateLimitWindow } from '../../../../../../shared/rate-limit-types'

const DAY_MS = 86_400_000

/** 今天 11:10 / 明天 07:00 / 11-14 07:00, as Android Dev's usage panel words a reset. */
function formatReset(resetsAt: number | null, now: number): string {
  if (resetsAt == null) {
    return ''
  }
  const at = new Date(resetsAt)
  const time = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
  const day = at.toDateString()
  const prefix =
    day === new Date(now).toDateString()
      ? '今天'
      : day === new Date(now + DAY_MS).toDateString()
        ? '明天'
        : `${at.getMonth() + 1}-${at.getDate()}`
  return `${prefix} ${time} 重置`
}

function UsageRow({ label, window, now }: { label: string; window: RateLimitWindow; now: number }) {
  const used = clampUsedPercent(window.usedPercent)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-chat-foreground-strong">{label}</span>
        <span className="tabular-nums text-chat-foreground">{Math.round(used)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <div
          className={`h-full rounded-full ${used >= 90 ? 'bg-destructive' : 'bg-blue-500'}`}
          style={{ width: `${used}%` }}
        />
      </div>
      <span className="text-xs text-chat-foreground-faint">
        {formatReset(window.resetsAt, now)}
      </span>
    </div>
  )
}

/** leniu: the 用量 popup of the composer bar, laid out like Android Dev's usage panel. */
export function NativeChatUsagePopup({ agent }: { agent?: string }) {
  const codex = agent === 'codex'
  const limits = useAppStore((s) => (codex ? s.rateLimits.codex : s.rateLimits.claude))
  const rows = [
    { label: '5 小时', window: limits?.session },
    { label: '每周(所有模型)', window: limits?.weekly },
    { label: '每周 Astra', window: limits?.fableWeekly },
    { label: '每月', window: limits?.monthly }
  ].filter((row): row is { label: string; window: RateLimitWindow } => Boolean(row.window))
  // Keeps 今天/明天 right while the popup stays open across midnight.
  const now = useResetCountdownClock(rows.map((row) => row.window.resetsAt))
  return (
    <div
      className={`flex flex-col gap-4 ${limits?.status === 'fetching' ? 'animate-pulse motion-reduce:animate-none' : ''}`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-chat-foreground-strong">
          {codex ? 'Codex' : 'codex'} 用量
        </span>
        {limits?.planType ? (
          <span className="text-xs text-chat-foreground-faint">{limits.planType} 套餐</span>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <span className="text-sm text-chat-foreground-faint">暂无用量数据</span>
      ) : (
        rows.map((row) => (
          <UsageRow key={row.label} label={row.label} window={row.window} now={now} />
        ))
      )}
    </div>
  )
}
