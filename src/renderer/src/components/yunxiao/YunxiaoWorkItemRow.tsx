import { cn } from '@/lib/utils'
import {
  isYunxiaoDone,
  yunxiaoCategoryLabel,
  type YunxiaoWorkItem
} from '../../../../shared/yunxiao/yunxiao-types'

const CATEGORY_CLASS: Record<string, string> = {
  Req: 'bg-blue-500/15 text-blue-500',
  Task: 'bg-emerald-500/15 text-emerald-500',
  Bug: 'bg-red-500/15 text-red-500'
}

export const YUNXIAO_ROW_GRID =
  'grid grid-cols-[6.5rem_2.5rem_minmax(0,1fr)_5.5rem_minmax(0,10rem)_5.5rem] items-center gap-3'

function formatDue(dueAt: string | null): string {
  return dueAt ? dueAt.slice(5, 10) : ''
}

export function YunxiaoWorkItemRow({
  item,
  selected,
  linked,
  onSelect
}: {
  item: YunxiaoWorkItem
  selected: boolean
  linked: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        YUNXIAO_ROW_GRID,
        'h-9 w-full rounded-md px-3 text-left text-sm transition-colors',
        selected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
        isYunxiaoDone(item) && 'text-muted-foreground'
      )}
    >
      <span className="truncate font-mono text-xs text-muted-foreground">{item.serialNumber}</span>
      <span
        className={cn(
          'w-fit rounded px-1.5 text-xs leading-5',
          CATEGORY_CLASS[item.category] ?? 'bg-muted text-muted-foreground'
        )}
      >
        {yunxiaoCategoryLabel(item.category)}
      </span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate">{item.subject}</span>
        {linked ? (
          <span className="shrink-0 rounded bg-primary/15 px-1 text-xs text-primary">已关联</span>
        ) : null}
      </span>
      <span className="truncate text-xs text-muted-foreground">{item.status.name}</span>
      <span className="truncate text-xs text-muted-foreground">{item.space.name}</span>
      <span className="truncate text-right text-xs text-muted-foreground">
        {formatDue(item.dueAt)}
      </span>
    </button>
  )
}
