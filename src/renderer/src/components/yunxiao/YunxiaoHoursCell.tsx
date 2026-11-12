import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'
import { yunxiaoDateIso } from '../../../../shared/yunxiao/yunxiao-date'
import type { YunxiaoWorkItemDetail } from '../../../../shared/yunxiao/yunxiao-types'
import { YunxiaoDatePicker } from './YunxiaoDatePicker'

function parseHours(value: string): number | null {
  const hours = Number(value)
  return Number.isFinite(hours) && hours > 0 && hours <= 1000 ? hours : null
}

/**
 * leniu: a list's 工时 cell — 预计 sets the user's estimate, 实际 logs a day's hours (登记); the row
 * then re-reads Yunxiao's totals.
 */
export function YunxiaoHoursCell({
  workItemId,
  kind,
  total,
  onChanged
}: {
  workItemId: string
  kind: 'estimate' | 'actual'
  total: number | null
  onChanged: (item: YunxiaoWorkItemDetail) => void
}) {
  const [open, setOpen] = useState(false)
  const [hours, setHours] = useState('')
  const [date, setDate] = useState(() => yunxiaoDateIso())
  const [busy, setBusy] = useState(false)
  const parsed = parseHours(hours)
  const estimate = kind === 'estimate'

  const save = async (): Promise<void> => {
    if (parsed === null) {
      return
    }
    setBusy(true)
    try {
      await (estimate
        ? yunxiaoClient.setEstimate(workItemId, parsed)
        : yunxiaoClient.addEffort(workItemId, { hours: parsed, date }))
      onChanged(await yunxiaoClient.get(workItemId))
      toast.success(estimate ? '已保存预计工时' : '已登记工时')
      setOpen(false)
      setHours('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setHours(estimate && total !== null ? String(total) : '')
          setDate(yunxiaoDateIso())
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          title={estimate ? '点击填写预计工时' : '点击登记实际工时'}
          className="h-7 rounded-md px-2 text-left text-xs tabular-nums hover:bg-accent"
        >
          {total === null ? '--' : total}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex w-60 flex-col gap-2 p-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-xs text-muted-foreground">
          {estimate ? '你预计要花多少小时' : '登记某一天实际花的时间'}
        </div>
        <div className="flex items-center gap-2">
          {estimate ? null : <YunxiaoDatePicker value={date} disabled={busy} onChange={setDate} />}
          <Input
            autoFocus
            value={hours}
            inputMode="decimal"
            placeholder="小时"
            onChange={(event) => setHours(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void save()}
            className="h-7 min-w-0 flex-1 text-xs"
          />
        </div>
        <Button size="sm" disabled={busy || parsed === null} onClick={() => void save()}>
          {estimate ? '保存' : '登记'}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
