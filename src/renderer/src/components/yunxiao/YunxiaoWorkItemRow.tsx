import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'
import {
  isYunxiaoDone,
  yunxiaoCategoryLabel,
  type YunxiaoWorkItem,
  type YunxiaoWorkItemDetail
} from '../../../../shared/yunxiao/yunxiao-types'
import { yunxiaoDueBadge } from '../../../../shared/yunxiao/yunxiao-date'
import { YunxiaoDatePicker } from './YunxiaoDatePicker'
import { YunxiaoStatusPill } from './YunxiaoStatusPill'
import { YunxiaoHoursCell } from './YunxiaoHoursCell'

const CATEGORY_CLASS: Record<string, string> = {
  Req: 'bg-blue-500/15 text-blue-500',
  Task: 'bg-emerald-500/15 text-emerald-500',
  Bug: 'bg-red-500/15 text-red-500'
}
const PRIORITY_DOT: Record<string, string> = {
  紧急: 'bg-red-500',
  高: 'bg-orange-500',
  中: 'bg-blue-500',
  低: 'bg-muted-foreground'
}

// Columns as Yunxiao's own list: 标题 状态 优先级 创建者 归属项目 计划开始 计划完成 预计工时 实际工时.
export const YUNXIAO_ROW_GRID =
  'grid min-w-[64rem] grid-cols-[minmax(16rem,1fr)_6rem_3.5rem_4.5rem_minmax(0,9rem)_6.5rem_6.5rem_4rem_4rem] items-center gap-3'

export const YUNXIAO_COLUMNS = [
  '标题',
  '状态',
  '优先级',
  '创建者',
  '归属项目',
  '计划开始',
  '计划完成',
  '预计工时',
  '实际工时'
]

export function YunxiaoWorkItemRow({
  item,
  selected,
  linked,
  onSelect,
  onChanged
}: {
  item: YunxiaoWorkItem
  selected: boolean
  linked: boolean
  onSelect: () => void
  onChanged: (item: YunxiaoWorkItemDetail) => void
}) {
  const done = isYunxiaoDone(item)
  const badge = done ? null : yunxiaoDueBadge(item.dueAt)
  const setDate = (dates: { start?: string; due?: string }): void => {
    yunxiaoClient
      .setPlanDates(item.id, dates)
      .then(onChanged)
      .catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : String(error))
      )
  }
  return (
    // A div: the status and date cells are buttons of their own.
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onSelect()
        }
      }}
      className={cn(
        YUNXIAO_ROW_GRID,
        'h-9 cursor-pointer rounded-md px-3 text-[13px] transition-colors',
        selected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
      )}
    >
      <span
        className="flex min-w-0 items-center gap-1.5"
        title={`${item.serialNumber} ${item.subject}`}
      >
        <span
          className={cn(
            'shrink-0 rounded px-1 text-[11px] leading-[18px]',
            CATEGORY_CLASS[item.category] ?? 'bg-muted text-muted-foreground'
          )}
        >
          {yunxiaoCategoryLabel(item.category)}
        </span>
        <span className={cn('truncate', done && 'text-muted-foreground')}>{item.subject}</span>
        {badge ? (
          <span
            className={cn(
              'shrink-0 rounded px-1 text-[11px] leading-[18px]',
              badge.tone === 'overdue'
                ? 'bg-red-600 text-white'
                : 'bg-orange-500/15 text-orange-500'
            )}
          >
            {badge.label}
          </span>
        ) : null}
        {linked ? (
          <span className="shrink-0 rounded bg-primary/15 px-1 text-[11px] text-primary">
            已关联
          </span>
        ) : null}
      </span>
      <YunxiaoStatusPill item={item} onChanged={onChanged} />
      <span className="flex items-center gap-1.5 text-xs">
        {item.priority ? (
          <span
            className={cn(
              'size-1.5 rounded-full',
              PRIORITY_DOT[item.priority] ?? 'bg-muted-foreground'
            )}
          />
        ) : null}
        {item.priority ?? '--'}
      </span>
      <span className="truncate text-xs">{item.creator?.name ?? '--'}</span>
      <span className="truncate text-xs text-blue-500" title={item.space.name}>
        {item.space.name}
      </span>
      <YunxiaoDatePicker
        compact
        value={item.startAt}
        disabled={false}
        onChange={(start) => setDate({ start })}
      />
      <YunxiaoDatePicker
        compact
        value={item.dueAt}
        disabled={false}
        onChange={(due) => setDate({ due })}
      />
      <YunxiaoHoursCell
        workItemId={item.id}
        kind="estimate"
        total={item.estimateHours}
        onChanged={onChanged}
      />
      <YunxiaoHoursCell
        workItemId={item.id}
        kind="actual"
        total={item.actualHours}
        onChanged={onChanged}
      />
    </div>
  )
}
