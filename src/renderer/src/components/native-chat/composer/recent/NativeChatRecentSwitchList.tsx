import { useMemo, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store'
import { useTranslate } from '@/i18n/use-translate'
import { cn } from '@/lib/utils'
import { getWorktreeStatusLabel, type WorktreeStatus } from '@/lib/worktree-status'
import { jumpToWorktreeFromSidebar } from '@/lib/workspace/activation/worktree-jump-navigation'
import { selectWorktreeActivityStatuses } from '@/components/sidebar/workspace-card/activity/use-worktree-activity-statuses'
import { formatOverviewVisit } from '../../../project-overview/project-overview-layout'
import { buildRecentSwitchRows, type RecentSwitchRow } from './recent-switch-rows'
import { NativeChatQuickPromptsMenu } from '../quick-prompts/NativeChatQuickPromptsMenu'

const DEFAULT_RECENT_COUNT = 5
const ROW_HEIGHT_PX = 22
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
        {row.current ? t('recentSwitch.current', 'Current') : formatOverviewVisit(row.visitedAt)}
      </span>
      <span className="truncate">{row.group}</span>
      <span className="flex min-w-0 items-baseline gap-1.5">
        <span className="truncate font-medium text-chat-foreground">
          {row.alias ?? row.product}
        </span>
        {row.alias && <span className="truncate text-3xs">{row.product}</span>}
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

const ROW_CLASS = 'h-5 shrink-0 rounded-md px-2 text-left text-3xs text-chat-foreground-faint'

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

function RecentRow({ row, status }: { row: RecentSwitchRow; status: WorktreeStatus }) {
  return (
    <button
      type="button"
      className={cn(ROW_GRID, ROW_CLASS, 'hover:bg-accent/60 hover:text-foreground')}
      onClick={() =>
        jumpToWorktreeFromSidebar(row.worktree.id, { executionHostId: row.worktree.hostId })
      }
    >
      <SwitchRowCells
        row={row}
        trailing={
          <span className={cn('truncate text-right', STATUS_CLASS[status])}>
            {STATUS_CLASS[status] ? getWorktreeStatusLabel(status) : ''}
          </span>
        }
      />
    </button>
  )
}

/**
 * leniu: quick switching shared by every chat tab. The current row is ordered above the input box;
 * the recent list keeps a fixed height so switching never moves the composer.
 */
export function NativeChatRecentSwitchList() {
  const count = useAppStore((s) => s.settings?.recentSwitchCount ?? DEFAULT_RECENT_COUNT)
  const lastVisited = useAppStore((s) => s.lastVisitedAtByWorktreeId)
  const activeWorktreeId = useAppStore((s) => s.activeWorktreeId)
  const repos = useAppStore((s) => s.repos)
  const worktreesByRepo = useAppStore((s) => s.worktreesByRepo)
  const aliases = useAppStore((s) => s.settings?.productAliases)
  const { current, recent } = useMemo(
    () => buildRecentSwitchRows(useAppStore.getState(), count),
    // Store slices are listed so the rows rebuild when visits, repos or names change.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [count, lastVisited, activeWorktreeId, repos, worktreesByRepo, aliases]
  )
  const rows = current ? [current, ...recent] : recent
  const statuses = useAppStore(
    useShallow((state) => {
      const byId = selectWorktreeActivityStatuses(
        state,
        rows.map((row) => row.worktree.id)
      )
      return rows.map((row) => byId.get(row.worktree.id) ?? 'inactive')
    })
  )
  const offset = current ? 1 : 0
  return (
    <>
      {current && (
        <div className="order-first mb-1 flex flex-col px-1">
          <CurrentRow row={current} />
        </div>
      )}
      <div className="mt-1.5 flex flex-col gap-0.5 px-1" style={{ height: count * ROW_HEIGHT_PX }}>
        {recent.map((row, index) => (
          <RecentRow key={row.worktree.id} row={row} status={statuses[index + offset]} />
        ))}
      </div>
    </>
  )
}
