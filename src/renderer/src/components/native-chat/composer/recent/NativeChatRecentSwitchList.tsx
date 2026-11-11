import { useMemo, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store'
import { useTranslate } from '@/i18n/use-translate'
import { cn } from '@/lib/utils'
import { getWorktreeStatusLabel, type WorktreeStatus } from '@/lib/worktree-status'
import { jumpToWorktreeFromSidebar } from '@/lib/workspace/activation/worktree-jump-navigation'
import { selectWorktreeActivityStatuses } from '@/components/sidebar/workspace-card/activity/use-worktree-activity-statuses'
import { buildRecentSwitchRows, type RecentSwitchRow } from './recent-switch-rows'
import { NativeChatQuickPromptsMenu } from '../quick-prompts/NativeChatQuickPromptsMenu'

export const DEFAULT_RECENT_COUNT = 5

/** Short like the device-side history: N 分钟前 / N 小时前 today, otherwise M-D. */
function formatRecentVisit(at: number | undefined, now = Date.now()): string {
  if (!at) {
    return ''
  }
  const minutes = Math.floor((now - at) / 60_000)
  const date = new Date(at)
  if (date.toDateString() !== new Date(now).toDateString()) {
    return `${date.getMonth() + 1}-${date.getDate()}`
  }
  return minutes < 1
    ? '刚刚'
    : minutes < 60
      ? `${minutes} 分钟前`
      : `${Math.floor(minutes / 60)} 小时前`
}
const ROW_HEIGHT_PX = 26
const ROW_GRID =
  'grid grid-cols-[52px_minmax(0,0.8fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_76px] items-center gap-2'
const STATUS_CLASS: Partial<Record<WorktreeStatus, string>> = {
  working: 'text-amber-500',
  permission: 'text-orange-500',
  done: 'text-emerald-500',
  failed: 'text-destructive',
  interrupted: 'text-muted-foreground'
}

function SwitchRowCells({ row, trailing }: { row: RecentSwitchRow; trailing: ReactNode }) {
  const t = useTranslate()
  return (
    <>
      <span className={cn('truncate', row.current && 'font-medium text-primary')}>
        {row.current ? t('recentSwitch.current', 'Current') : formatRecentVisit(row.visitedAt)}
      </span>
      <span className="truncate text-right">{row.group}</span>
      <span className="flex min-w-0 items-baseline gap-1.5">
        <span className="truncate font-medium text-chat-foreground">
          {row.alias ?? row.product}
        </span>
        {row.alias && <span className="truncate text-xs">{row.product}</span>}
      </span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="shrink-0 rounded bg-foreground/10 px-1 text-3xs leading-3.5">
          {row.isMain ? t('projectOverview.main', 'Main') : 'tree'}
        </span>
        <span className="truncate">{row.branch}</span>
      </span>
      {trailing}
    </>
  )
}

const ROW_CLASS = 'h-6 shrink-0 rounded-md px-2 text-left text-sm text-chat-foreground-faint'

// The current row hosts the 快捷指令 menu, so it is a plain container rather than a button.
function CurrentRow({ row }: { row: RecentSwitchRow }) {
  return (
    <div className={cn(ROW_GRID, ROW_CLASS, 'text-foreground')}>
      <SwitchRowCells
        row={row}
        trailing={
          <span className="flex justify-end">
            <NativeChatQuickPromptsMenu />
          </span>
        }
      />
    </div>
  )
}

export function RecentRow({ row, status }: { row: RecentSwitchRow; status: WorktreeStatus }) {
  const updateSettings = useAppStore((s) => s.updateSettings)
  const open = (): void => {
    jumpToWorktreeFromSidebar(row.worktree.id, { executionHostId: row.worktree.hostId })
  }
  return (
    // A div so the row can hold its own remove button; Enter/Space still switch.
    <div
      role="button"
      tabIndex={0}
      className={cn(
        ROW_GRID,
        ROW_CLASS,
        'group/recent cursor-pointer hover:bg-accent/60 hover:text-foreground'
      )}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          open()
        }
      }}
    >
      <SwitchRowCells
        row={row}
        trailing={
          <span className="flex min-w-0 items-center justify-end gap-1">
            <span
              className={cn('truncate text-right group-hover/recent:hidden', STATUS_CLASS[status])}
            >
              {STATUS_CLASS[status] ? getWorktreeStatusLabel(status) : ''}
            </span>
            <button
              type="button"
              aria-label="从最近里移除"
              title="从最近里移除（再次切换过去会重新出现）"
              className="hidden rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground group-hover/recent:block"
              onClick={(event) => {
                event.stopPropagation()
                const hidden = useAppStore.getState().settings?.recentSwitchHiddenAt ?? {}
                void updateSettings({
                  recentSwitchHiddenAt: { ...hidden, [row.worktree.id]: Date.now() }
                })
              }}
            >
              <X className="size-3.5" />
            </button>
          </span>
        }
      />
    </div>
  )
}

/** Rows for the current workspace and the most recently visited ones, with their activity. */
export function useRecentSwitchRows(count: number): {
  current: RecentSwitchRow | null
  recent: RecentSwitchRow[]
  recentStatuses: WorktreeStatus[]
} {
  const lastVisited = useAppStore((s) => s.lastVisitedAtByWorktreeId)
  const activeWorktreeId = useAppStore((s) => s.activeWorktreeId)
  const repos = useAppStore((s) => s.repos)
  const worktreesByRepo = useAppStore((s) => s.worktreesByRepo)
  const aliases = useAppStore((s) => s.settings?.productAliases)
  const hiddenAt = useAppStore((s) => s.settings?.recentSwitchHiddenAt)
  const clearedAt = useAppStore((s) => s.settings?.recentSwitchClearedAt)
  const { current, recent } = useMemo(
    () => buildRecentSwitchRows(useAppStore.getState(), count),
    // Store slices are listed so the rows rebuild when visits, repos or names change.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [count, lastVisited, activeWorktreeId, repos, worktreesByRepo, aliases, hiddenAt, clearedAt]
  )
  const recentStatuses = useAppStore(
    useShallow((state) => {
      const byId = selectWorktreeActivityStatuses(
        state,
        recent.map((row) => row.worktree.id)
      )
      return recent.map((row) => byId.get(row.worktree.id) ?? 'inactive')
    })
  )
  return { current: current ?? null, recent, recentStatuses }
}

/**
 * leniu: quick switching shared by every chat tab. The current row is ordered above the input box;
 * the recent list reserves only the rows it has; once full (5), switching keeps the composer still.
 */
export function NativeChatRecentSwitchList() {
  const count = useAppStore((s) => s.settings?.recentSwitchCount ?? DEFAULT_RECENT_COUNT)
  const { current, recent, recentStatuses } = useRecentSwitchRows(count)
  return (
    <>
      {current && (
        <div className="order-first mb-1 flex flex-col px-1">
          <CurrentRow row={current} />
        </div>
      )}
      {recent.length > 0 && (
        <div
          className="mt-1.5 flex flex-col gap-0.5 px-1"
          style={{ height: recent.length * ROW_HEIGHT_PX }}
        >
          {recent.map((row, index) => (
            <RecentRow key={row.worktree.id} row={row} status={recentStatuses[index]} />
          ))}
        </div>
      )}
    </>
  )
}
