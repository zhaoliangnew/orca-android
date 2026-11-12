import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { yunxiaoDateIso } from '../../../../shared/yunxiao/yunxiao-date'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const pad = (value: number): string => String(value).padStart(2, '0')
const toIso = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

function parseIso(value: string | null): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null
}

/** Six Monday-first weeks covering the month. */
function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => new Date(year, month, index - offset + 1))
}

/** leniu: a Chinese calendar for Yunxiao plan dates (the native picker follows Orca's English UI). */
export function YunxiaoDatePicker({
  value,
  disabled,
  onChange,
  compact = false
}: {
  /** YYYY-MM-DD..., or null when unset. */
  value: string | null
  disabled: boolean
  onChange: (date: string) => void
  /** A bare table cell: no icon or border, -- when unset. */
  compact?: boolean
}) {
  const selected = parseIso(value)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => selected ?? new Date())
  // Read when the calendar opens, not on every render.
  const [today, setToday] = useState(() => yunxiaoDateIso())
  const year = view.getFullYear()
  const month = view.getMonth()
  const selectedIso = selected ? toIso(selected) : null

  const pick = (date: Date): void => {
    setOpen(false)
    if (toIso(date) !== selectedIso) {
      onChange(toIso(date))
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setView(selected ?? new Date())
          setToday(yunxiaoDateIso())
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            'flex h-7 items-center gap-1.5 rounded-md px-2 text-xs disabled:opacity-50',
            compact ? 'tabular-nums hover:bg-accent' : 'border border-border/50 hover:bg-accent/50'
          )}
        >
          {compact ? null : <CalendarDays className="size-3.5 text-muted-foreground" />}
          <span className={cn(!selectedIso && 'text-muted-foreground')}>
            {selectedIso ?? (compact ? '--' : '未设置')}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 p-2"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <button
            type="button"
            aria-label="上个月"
            className="rounded p-1 hover:bg-accent"
            onClick={() => setView(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-medium">
            {year} 年 {month + 1} 月
          </span>
          <button
            type="button"
            aria-label="下个月"
            className="rounded p-1 hover:bg-accent"
            onClick={() => setView(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
          {WEEKDAYS.map((day) => (
            <span key={day} className="py-1 text-muted-foreground">
              {day}
            </span>
          ))}
          {monthGrid(year, month).map((date) => {
            const iso = toIso(date)
            return (
              <button
                key={iso}
                type="button"
                onClick={() => pick(date)}
                className={cn(
                  'h-7 rounded tabular-nums hover:bg-accent',
                  date.getMonth() !== month && 'text-muted-foreground/50',
                  iso === today && 'font-semibold text-primary',
                  iso === selectedIso && 'bg-primary text-primary-foreground hover:bg-primary'
                )}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            className="rounded px-2 py-1 text-xs text-primary hover:bg-accent"
            onClick={() => {
              const [y, m, d] = yunxiaoDateIso().split('-').map(Number)
              pick(new Date(y, m - 1, d))
            }}
          >
            今天
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
