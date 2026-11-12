import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  isYunxiaoDone,
  type YunxiaoCategory,
  type YunxiaoListFilter,
  type YunxiaoWorkItem
} from '../../../../shared/yunxiao/yunxiao-types'
import { useYunxiaoPage } from './yunxiao-page-store'
import { isPlannedInWeek, yunxiaoWeekRange } from '../../../../shared/yunxiao/yunxiao-date'
import { YunxiaoConnectForm } from './YunxiaoConnectForm'
import { YunxiaoCreateDialog } from './YunxiaoCreateDialog'
import { YunxiaoPanelMenu } from './YunxiaoPanelMenu'
import { YUNXIAO_PAGE_SIZE, YunxiaoPagination } from './YunxiaoPagination'
import { YunxiaoWorkItemDetail } from './YunxiaoWorkItemDetail'
import { YUNXIAO_COLUMNS, YUNXIAO_ROW_GRID, YunxiaoWorkItemRow } from './YunxiaoWorkItemRow'

// 本周计划 is the page's own view: work whose plan dates touch this (Beijing) week.
type PanelFilter = YunxiaoListFilter | 'week' | 'lastWeek'

const FILTERS: { id: PanelFilter; label: string }[] = [
  { id: 'week', label: '本周计划' },
  { id: 'lastWeek', label: '上周计划' },
  { id: 'open', label: '未完成' },
  { id: 'done', label: '已完成' },
  { id: 'all', label: '全部' }
]
const CATEGORIES: { id: YunxiaoCategory | 'any'; label: string }[] = [
  { id: 'any', label: '全部类型' },
  { id: 'Req', label: '需求' },
  { id: 'Task', label: '任务' },
  { id: 'Bug', label: '缺陷' }
]

function Chip({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-7 rounded-md border px-2.5 text-xs transition-colors',
        active
          ? 'border-foreground/40 bg-muted/70 text-foreground'
          : 'border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

const WEEK_MS = 7 * 24 * 60 * 60_000

/** The plan week a filter shows (this or last, Beijing calendar), or null for status filters. */
function weekOf(filter: PanelFilter): { start: string; end: string } | null {
  return filter === 'week'
    ? yunxiaoWeekRange()
    : filter === 'lastWeek'
      ? yunxiaoWeekRange(Date.now() - WEEK_MS)
      : null
}

function filterYunxiaoItems(
  items: YunxiaoWorkItem[],
  options: {
    filter: PanelFilter
    category: YunxiaoCategory | 'any'
    projectId: string | null
    keyword: string
  }
): YunxiaoWorkItem[] {
  const keyword = options.keyword.trim().toLowerCase()
  const week = weekOf(options.filter)
  const matches = items.filter(
    (item) =>
      (week
        ? isPlannedInWeek(item, week)
        : options.filter === 'all' || isYunxiaoDone(item) === (options.filter === 'done')) &&
      (options.category === 'any' || item.category === options.category) &&
      (!options.projectId || item.space.id === options.projectId) &&
      (!keyword ||
        item.subject.toLowerCase().includes(keyword) ||
        item.serialNumber.toLowerCase().includes(keyword))
  )
  // The week reads as a schedule: earliest due first, undone before done on the same day.
  return week
    ? matches.sort(
        (a, b) =>
          (a.dueAt ?? a.startAt ?? '').localeCompare(b.dueAt ?? b.startAt ?? '') ||
          Number(isYunxiaoDone(a)) - Number(isYunxiaoDone(b))
      )
    : matches
}

/** A plan week's dates (Monday to Sunday, Beijing calendar), inside its chip. */
function WeekRangeHint({ filter }: { filter: PanelFilter }) {
  const [week] = useState(() => weekOf(filter))
  return week ? (
    <span className="ml-1 text-muted-foreground" title="周一到周日，按北京时间">
      {week.start.slice(5)}~{week.end.slice(5)}
    </span>
  ) : null
}

/** leniu: the tasks page's Yunxiao (云效) view — my work items across the watched projects. */
export function YunxiaoPanel() {
  const status = useYunxiaoPage((s) => s.status)
  const links = useYunxiaoPage((s) => s.links)
  const refreshStatus = useYunxiaoPage((s) => s.refreshStatus)
  const refreshLinks = useYunxiaoPage((s) => s.refreshLinks)
  const [filter, setFilter] = useState<PanelFilter>('week')
  const [category, setCategory] = useState<YunxiaoCategory | 'any'>('Task')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const allItems = useYunxiaoPage((s) => s.items)
  const loading = useYunxiaoPage((s) => s.loading)
  const loadItems = useYunxiaoPage((s) => s.loadItems)
  const patchItem = useYunxiaoPage((s) => s.patchItem)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    void refreshStatus().catch(() => undefined)
    void refreshLinks()
  }, [refreshStatus, refreshLinks])

  const connected = status?.connected === true
  const load = useCallback(
    (ifStale = false) =>
      loadItems({ ifStale }).catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : String(error))
      ),
    [loadItems]
  )

  const rescanIfDue = useYunxiaoPage((s) => s.rescanIfDue)
  useEffect(() => {
    if (connected) {
      void load(true)
      // Quietly; a failed daily scan keeps yesterday's projects.
      void rescanIfDue().catch(() => undefined)
    }
  }, [connected, load, rescanIfDue, status?.watchedProjects.length])

  // Filters run locally over the one loaded list, so switching is instant.
  const items = useMemo(
    () => filterYunxiaoItems(allItems, { filter, category, projectId, keyword }),
    [allItems, filter, category, projectId, keyword]
  )
  const pageCount = Math.max(1, Math.ceil(items.length / YUNXIAO_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = items.slice(
    (currentPage - 1) * YUNXIAO_PAGE_SIZE,
    currentPage * YUNXIAO_PAGE_SIZE
  )
  const linkedIds = useMemo(() => new Set(links.map((link) => link.workItemId)), [links])

  if (!status) {
    return <div className="mt-6 text-xs text-muted-foreground">加载中…</div>
  }
  if (!connected) {
    return <YunxiaoConnectForm />
  }
  const projects = status.watchedProjects

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((entry) => (
          <Chip
            key={entry.id}
            active={filter === entry.id}
            onClick={() => {
              setFilter(entry.id)
              setPage(1)
            }}
          >
            {entry.label}
            {entry.id === filter && (filter === 'week' || filter === 'lastWeek') ? (
              <WeekRangeHint filter={filter} />
            ) : null}
          </Chip>
        ))}
        <span className="mx-1 h-4 w-px bg-border/60" />
        {CATEGORIES.map((entry) => (
          <Chip
            key={entry.id}
            active={category === entry.id}
            onClick={() => {
              setCategory(entry.id)
              setPage(1)
            }}
          >
            {entry.label}
          </Chip>
        ))}
        <select
          value={projectId ?? ''}
          onChange={(event) => {
            setProjectId(event.target.value || null)
            setPage(1)
          }}
          className="h-7 max-w-48 rounded-md border border-border/40 bg-transparent px-2 text-xs text-muted-foreground"
        >
          <option value="">全部项目（{projects.length}）</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            placeholder="搜编号或标题"
            onChange={(event) => {
              setKeyword(event.target.value)
              setPage(1)
            }}
            className="h-7 w-48 pl-7 text-xs"
          />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" disabled={loading} onClick={() => void load(false)}>
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            刷新
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            新建
          </Button>
          <YunxiaoPanelMenu status={status} />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden rounded-md border border-border/50 bg-muted/30">
        {/* Nine columns: the table scrolls sideways when the detail pane narrows it. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto scrollbar-sleek">
          <div
            className={cn(
              YUNXIAO_ROW_GRID,
              'h-8 shrink-0 border-b border-border/50 px-3 text-xs text-muted-foreground'
            )}
          >
            {YUNXIAO_COLUMNS.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          <div className="min-h-0 w-max min-w-full flex-1 overflow-y-auto p-1 scrollbar-sleek">
            {items.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {loading ? `正在查询 ${projects.length} 个项目…` : '没有符合条件的工作项'}
              </div>
            ) : (
              pageItems.map((item) => (
                <YunxiaoWorkItemRow
                  key={item.id}
                  item={item}
                  selected={item.id === selectedId}
                  linked={linkedIds.has(item.id)}
                  onSelect={() => setSelectedId(item.id)}
                  onChanged={patchItem}
                />
              ))
            )}
          </div>
          <YunxiaoPagination total={items.length} page={currentPage} onPage={setPage} />
        </div>
        {selectedId ? (
          <div className="flex w-[min(28rem,45%)] shrink-0 flex-col border-l border-border/50">
            <YunxiaoWorkItemDetail
              // A change made from the list (status, dates) re-reads the detail.
              key={`${selectedId}:${allItems.find((entry) => entry.id === selectedId)?.updatedAt ?? 0}`}
              workItemId={selectedId}
              onChanged={(changed) => {
                if (changed) {
                  patchItem(changed)
                } else {
                  void load(false)
                }
                void refreshLinks()
              }}
            />
          </div>
        ) : null}
      </div>
      <YunxiaoCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projects={projects}
        onCreated={(id) => {
          setSelectedId(id)
          void load(false)
        }}
      />
    </div>
  )
}
