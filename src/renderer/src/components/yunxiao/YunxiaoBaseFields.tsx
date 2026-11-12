import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'
import {
  yunxiaoCategoryLabel,
  type YunxiaoWorkItemDetail
} from '../../../../shared/yunxiao/yunxiao-types'
import { YunxiaoDatePicker } from './YunxiaoDatePicker'
import { YunxiaoStatusPill } from './YunxiaoStatusPill'

const PRIORITY_DOT: Record<string, string> = {
  紧急: 'bg-red-500',
  高: 'bg-orange-500',
  中: 'bg-blue-500',
  低: 'bg-muted-foreground'
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-7 items-start gap-3 text-[13px]">
      <span className="w-[5.5rem] shrink-0 pt-1 text-muted-foreground">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 pt-0.5">{children}</div>
    </div>
  )
}

const empty = <span className="pt-0.5 text-muted-foreground/60">--</span>

/** leniu: 基础字段, in Yunxiao's order; status and plan dates edit in place. */
export function YunxiaoBaseFields({
  item,
  onChanged
}: {
  item: YunxiaoWorkItemDetail
  onChanged: (item: YunxiaoWorkItemDetail) => void
}) {
  const setDates = (dates: { start?: string; due?: string }): void => {
    yunxiaoClient
      .setPlanDates(item.id, dates)
      .then(onChanged)
      .catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : String(error))
      )
  }
  return (
    <div className="flex flex-col gap-1.5 border-t border-border/50 pt-3">
      <div className="mb-1 text-[13px] font-semibold">基础字段</div>
      <Field label="工作项类型">{item.typeName || yunxiaoCategoryLabel(item.category)}</Field>
      <Field label="状态">
        <YunxiaoStatusPill item={item} onChanged={onChanged} />
      </Field>
      <Field label="负责人">{item.assignedTo?.name ?? empty}</Field>
      <Field label="优先级">
        {item.priority ? (
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                'size-1.5 rounded-full',
                PRIORITY_DOT[item.priority] ?? 'bg-muted-foreground'
              )}
            />
            {item.priority}
          </span>
        ) : (
          empty
        )}
      </Field>
      <Field label="归属项目">{item.space.name}</Field>
      <Field label="迭代">{item.sprint?.name ?? empty}</Field>
      <Field label="抄送">
        {item.trackers.length > 0
          ? item.trackers.map((user) => (
              <span
                key={user.id}
                className="rounded bg-blue-500/15 px-1.5 text-xs leading-5 text-blue-500"
              >
                {user.name}
              </span>
            ))
          : empty}
      </Field>
      <Field label="计划开始时间">
        <YunxiaoDatePicker
          compact
          value={item.startAt}
          disabled={false}
          onChange={(start) => setDates({ start })}
        />
      </Field>
      <Field label="计划完成时间">
        <YunxiaoDatePicker
          compact
          value={item.dueAt}
          disabled={false}
          onChange={(due) => setDates({ due })}
        />
      </Field>
    </div>
  )
}
