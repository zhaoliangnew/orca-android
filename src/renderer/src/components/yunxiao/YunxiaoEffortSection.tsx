import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { CirclePlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'
import { yunxiaoDateIso } from '../../../../shared/yunxiao/yunxiao-date'
import type { YunxiaoEfforts } from '../../../../shared/yunxiao/yunxiao-types'
import { YunxiaoDatePicker } from './YunxiaoDatePicker'
import { useYunxiaoPage } from './yunxiao-page-store'

const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)
const sum = (values: number[]): number => Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100

function parseHours(value: string): number | null {
  const hours = Number(value)
  return Number.isFinite(hours) && hours > 0 && hours <= 1000 ? hours : null
}

/** One 工时 line as Yunxiao shows it: label, total, and a ⊕ action that opens its form. */
function EffortLine({
  label,
  total,
  action,
  open,
  onOpenChange,
  children
}: {
  label: string
  total: number
  action: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <div className="flex min-h-7 items-center gap-3 text-[13px]">
      <span className="w-[5.5rem] shrink-0 text-muted-foreground">{label}</span>
      {total > 0 ? <span className="tabular-nums">{total} 小时</span> : null}
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <CirclePlus className="size-3.5" />
            {action}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex w-64 flex-col gap-2 p-3">
          {children}
        </PopoverContent>
      </Popover>
    </div>
  )
}

/** leniu: 预计工时 (预估) and 实际工时 (登记, one entry per day) of a Yunxiao work item. */
export function YunxiaoEffortSection({
  workItemId,
  onChanged
}: {
  workItemId: string
  onChanged?: () => void
}) {
  const userId = useYunxiaoPage((s) => s.status?.user?.id)
  const [efforts, setEfforts] = useState<YunxiaoEfforts | null>(null)
  const [estimate, setEstimate] = useState('')
  const [hours, setHours] = useState('')
  const [date, setDate] = useState<string>(() => yunxiaoDateIso())
  const [busy, setBusy] = useState(false)
  const [openForm, setOpenForm] = useState<'estimate' | 'log' | null>(null)

  const apply = useCallback(
    (next: YunxiaoEfforts) => {
      setEfforts(next)
      const mine = next.estimated.find((entry) => entry.owner?.id === userId)
      setEstimate(mine ? String(mine.hours) : '')
    },
    [userId]
  )

  useEffect(() => {
    let cancelled = false
    yunxiaoClient
      .efforts(workItemId)
      .then((next) => !cancelled && apply(next))
      .catch((error: unknown) => !cancelled && toast.error(errorText(error)))
    return () => {
      cancelled = true
    }
  }, [workItemId, apply])

  const run = async (action: () => Promise<YunxiaoEfforts>, done: string): Promise<void> => {
    setBusy(true)
    try {
      apply(await action())
      setOpenForm(null)
      toast.success(done)
      onChanged?.()
    } catch (error) {
      toast.error(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  if (!efforts) {
    return null
  }
  const estimatedHours = parseHours(estimate)
  const loggedHours = parseHours(hours)
  const estimatedTotal = sum(efforts.estimated.map((entry) => entry.hours))
  const actualTotal = sum(efforts.records.map((entry) => entry.hours))
  // Yunxiao's progress bar: actual over estimate.
  const progress =
    estimatedTotal > 0 ? Math.min(100, Math.round((actualTotal / estimatedTotal) * 100)) : 0
  return (
    <div className="flex flex-col gap-1.5 border-t border-border/50 pt-3">
      <div className="mb-1 text-[13px] font-semibold">工时</div>
      <EffortLine
        label="预计工时"
        total={estimatedTotal}
        action="预估"
        open={openForm === 'estimate'}
        onOpenChange={(open) => setOpenForm(open ? 'estimate' : null)}
      >
        <div className="text-xs text-muted-foreground">你预计要花多少小时</div>
        <Input
          autoFocus
          value={estimate}
          inputMode="decimal"
          placeholder="小时"
          onChange={(event) => setEstimate(event.target.value)}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          disabled={busy || estimatedHours === null}
          onClick={() =>
            estimatedHours !== null &&
            void run(() => yunxiaoClient.setEstimate(workItemId, estimatedHours), '已保存预计工时')
          }
        >
          保存
        </Button>
      </EffortLine>
      <EffortLine
        label="实际工时"
        total={actualTotal}
        action="登记"
        open={openForm === 'log'}
        onOpenChange={(open) => setOpenForm(open ? 'log' : null)}
      >
        <div className="text-xs text-muted-foreground">登记某一天实际花的时间</div>
        <div className="flex items-center gap-2">
          <YunxiaoDatePicker value={date} disabled={busy} onChange={setDate} />
          <Input
            autoFocus
            value={hours}
            inputMode="decimal"
            placeholder="小时"
            onChange={(event) => setHours(event.target.value)}
            className="h-7 w-20 text-xs"
          />
        </div>
        <Button
          size="sm"
          disabled={busy || loggedHours === null}
          onClick={() =>
            loggedHours !== null &&
            void run(async () => {
              const next = await yunxiaoClient.addEffort(workItemId, {
                hours: loggedHours,
                date
              })
              setHours('')
              return next
            }, '已登记工时')
          }
        >
          登记
        </Button>
      </EffortLine>
      <div className="flex items-center gap-3 py-1">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
        </div>
        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
          {progress}%
        </span>
      </div>
      {efforts.records.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          {efforts.records.map((entry) => (
            <div key={entry.id} className="flex gap-2 text-xs text-muted-foreground">
              <span className="w-20 shrink-0 tabular-nums">{entry.date}</span>
              <span className="w-10 shrink-0 tabular-nums">{entry.hours}h</span>
              <span className="w-12 shrink-0 truncate">{entry.owner?.name}</span>
              <span className="min-w-0 truncate">{entry.description}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
