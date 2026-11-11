import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, FolderPlus, MessageSquareShare, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useAppStore } from '@/store'
import { openAppHttpLink } from '@/lib/browser/navigation/app-http-link-open'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'
import {
  yunxiaoCategoryLabel,
  type YunxiaoComment,
  type YunxiaoStatus,
  type YunxiaoWorkItemDetail as Detail
} from '../../../../shared/yunxiao/yunxiao-types'
import { sendYunxiaoWorkItemToChat } from './yunxiao-send-to-chat'
import { YunxiaoSubmitTestDialog } from './YunxiaoSubmitTestDialog'
import { yunxiaoDescriptionText } from './yunxiao-description'
import { YunxiaoDatePicker } from './YunxiaoDatePicker'
import { YunxiaoEffortSection } from './YunxiaoEffortSection'

function formatCommentTime(ms: number): string {
  const date = new Date(ms)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getMonth() + 1}-${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

function Meta({ label, value }: { label: string; value: string | null | undefined }) {
  return value ? (
    <div className="flex gap-2 text-xs">
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate">{value}</span>
    </div>
  ) : null
}

function PlanDateRow({
  label,
  value,
  disabled,
  onChange
}: {
  label: string
  value: string | null
  disabled: boolean
  onChange: (date: string) => void
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <YunxiaoDatePicker value={value} disabled={disabled} onChange={onChange} />
    </div>
  )
}

/** leniu: one Yunxiao work item — status, description, comments and what to do with it. */
export function YunxiaoWorkItemDetail({
  workItemId,
  onChanged
}: {
  workItemId: string
  onChanged: () => void
}) {
  const [item, setItem] = useState<Detail | null>(null)
  const [comments, setComments] = useState<YunxiaoComment[]>([])
  const [statuses, setStatuses] = useState<YunxiaoStatus[]>([])
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitTestOpen, setSubmitTestOpen] = useState(false)
  const openModal = useAppStore((s) => s.openModal)

  const load = useCallback(async () => {
    const [detail, list, options] = await Promise.all([
      yunxiaoClient.get(workItemId),
      yunxiaoClient.comments(workItemId).catch(() => []),
      yunxiaoClient.statuses(workItemId).catch(() => [])
    ])
    setItem(detail)
    setComments(list)
    setStatuses(options)
  }, [workItemId])

  useEffect(() => {
    setItem(null)
    load().catch((error) => toast.error(errorText(error)))
  }, [load])

  if (!item) {
    return <div className="p-4 text-xs text-muted-foreground">加载中…</div>
  }

  const run = async (action: () => Promise<void>): Promise<void> => {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      toast.error(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 scrollbar-sleek">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-muted-foreground">
          {yunxiaoCategoryLabel(item.category)} · {item.serialNumber}
        </div>
        <div className="text-base font-medium leading-snug">{item.subject}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const result = await sendYunxiaoWorkItemToChat(item.id)
              toast.success(
                result === 'inserted'
                  ? '已放进当前聊天输入框，并关联到这个工作区'
                  : '当前没有聊天输入框，内容已复制'
              )
            })
          }
        >
          <MessageSquareShare className="size-3.5" />
          发给当前会话
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            openModal('new-workspace-composer', {
              prefilledName: `${item.serialNumber}-${item.subject}`.slice(0, 60),
              recovery: { note: `${item.serialNumber} ${item.subject}\n${item.url}`, agent: null },
              telemetrySource: 'unknown'
            })
          }
        >
          <FolderPlus className="size-3.5" />
          开工作区
        </Button>
        {item.category === 'Req' ? (
          <Button size="sm" variant="outline" onClick={() => setSubmitTestOpen(true)}>
            <Send className="size-3.5" />
            提测
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={(event) => openAppHttpLink(item.url, { event })}>
          <ExternalLink className="size-3.5" />
          云效打开
        </Button>
      </div>
      <div className="flex flex-col gap-1.5 rounded-md border border-border/50 p-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-16 shrink-0 text-muted-foreground">状态</span>
          <Select
            value={item.status.id}
            disabled={busy || statuses.length === 0}
            onValueChange={(status) =>
              void run(async () => {
                setItem(await yunxiaoClient.setStatus(item.id, status))
                onChanged()
              })
            }
          >
            <SelectTrigger size="sm" className="h-7 w-40 text-xs">
              <SelectValue>{item.status.name}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Meta label="项目" value={item.space.name} />
        <Meta label="负责人" value={item.assignedTo?.name} />
        <Meta label="创建人" value={item.creator?.name} />
        <Meta label="迭代" value={item.sprint?.name} />
        <Meta label="优先级" value={item.priority} />
        <PlanDateRow
          label="计划开始"
          value={item.startAt}
          disabled={busy}
          onChange={(start) =>
            void run(async () => {
              setItem(await yunxiaoClient.setPlanDates(item.id, { start }))
              onChanged()
            })
          }
        />
        <PlanDateRow
          label="计划完成"
          value={item.dueAt}
          disabled={busy}
          onChange={(due) =>
            void run(async () => {
              setItem(await yunxiaoClient.setPlanDates(item.id, { due }))
              onChanged()
            })
          }
        />
      </div>
      <YunxiaoEffortSection workItemId={item.id} />
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium">描述</div>
        <div className="whitespace-pre-wrap break-words text-sm text-foreground/90">
          {yunxiaoDescriptionText(item.description) || '（无）'}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-xs font-medium">评论 {comments.length > 0 ? comments.length : ''}</div>
        {comments.map((entry) => (
          <div key={entry.id} className="rounded-md bg-muted/40 p-2 text-sm">
            <div className="mb-0.5 text-xs text-muted-foreground">
              {entry.author?.name ?? '某人'} · {formatCommentTime(entry.createdAt)}
            </div>
            <div className="whitespace-pre-wrap break-words">
              {yunxiaoDescriptionText(entry.content)}
            </div>
          </div>
        ))}
        <Textarea
          placeholder="写评论…"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="min-h-16 text-sm"
        />
        <Button
          size="sm"
          className="self-end"
          disabled={busy || !comment.trim()}
          onClick={() =>
            void run(async () => {
              await yunxiaoClient.addComment(item.id, comment.trim())
              setComment('')
              setComments(await yunxiaoClient.comments(item.id))
            })
          }
        >
          评论
        </Button>
      </div>
      <YunxiaoSubmitTestDialog
        open={submitTestOpen}
        onOpenChange={setSubmitTestOpen}
        requirement={item}
        onDone={onChanged}
      />
    </div>
  )
}
