import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'
import type {
  YunxiaoStatus,
  YunxiaoWorkItem,
  YunxiaoWorkItemDetail
} from '../../../../shared/yunxiao/yunxiao-types'

// Yunxiao's status colors by stage: to do blue, doing green, fixed teal, dev done/提测 violet, closed grey.
const STAGE_CLASS: Record<string, string> = {
  '1': 'bg-blue-500 text-white',
  '2': 'bg-emerald-500 text-white',
  '3': 'bg-teal-500 text-white',
  '11': 'bg-violet-500 text-white'
}
const CLOSED_CLASS = 'bg-muted text-muted-foreground'

/** leniu: a work item's status as Yunxiao's colored pill; click to move it to another status. */
export function YunxiaoStatusPill({
  item,
  onChanged
}: {
  item: YunxiaoWorkItem
  onChanged: (item: YunxiaoWorkItemDetail) => void
}) {
  const [open, setOpen] = useState(false)
  const [statuses, setStatuses] = useState<YunxiaoStatus[] | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next && !statuses) {
          yunxiaoClient
            .statuses(item.id)
            .then(setStatuses)
            .catch(() => setStatuses([]))
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={busy}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            'flex h-6 w-[5.5rem] items-center justify-between gap-1 rounded px-2 text-xs',
            STAGE_CLASS[item.statusStage] ?? CLOSED_CLASS,
            busy && 'opacity-60'
          )}
        >
          <span className="truncate">{item.status.name}</span>
          <ChevronDown className="size-3 shrink-0 opacity-80" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-40 p-1"
        onClick={(event) => event.stopPropagation()}
      >
        {statuses === null ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">加载中…</div>
        ) : (
          statuses.map((status) => (
            <button
              key={status.id}
              type="button"
              className={cn(
                'flex w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent',
                status.id === item.status.id && 'font-medium text-primary'
              )}
              onClick={() => {
                setOpen(false)
                if (status.id === item.status.id) {
                  return
                }
                setBusy(true)
                yunxiaoClient
                  .setStatus(item.id, status.id)
                  .then(onChanged)
                  .catch((error: unknown) =>
                    toast.error(error instanceof Error ? error.message : String(error))
                  )
                  .finally(() => setBusy(false))
              }}
            >
              {status.name}
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  )
}
