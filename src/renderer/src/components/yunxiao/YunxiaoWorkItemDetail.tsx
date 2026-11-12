import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, FolderPlus, MessageSquareShare, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/store'
import { openAppHttpLink } from '@/lib/browser/navigation/app-http-link-open'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'
import {
  yunxiaoCategoryLabel,
  type YunxiaoComment,
  type YunxiaoWorkItemDetail as Detail
} from '../../../../shared/yunxiao/yunxiao-types'
import { sendYunxiaoWorkItemToChat } from './yunxiao-send-to-chat'
import { YunxiaoSubmitTestDialog } from './YunxiaoSubmitTestDialog'
import { yunxiaoDescriptionText } from './yunxiao-description'
import { YunxiaoBaseFields } from './YunxiaoBaseFields'
import { YunxiaoEffortSection } from './YunxiaoEffortSection'

function formatFullTime(ms: number): string {
  const date = new Date(ms)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatCommentTime(ms: number): string {
  const date = new Date(ms)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getMonth() + 1}-${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

/** leniu: one Yunxiao work item — status, description, comments and what to do with it. */
export function YunxiaoWorkItemDetail({
  workItemId,
  onChanged
}: {
  workItemId: string
  /** With the changed item for an in-place list update; without one the list reloads. */
  onChanged: (item?: Detail) => void
}) {
  const [item, setItem] = useState<Detail | null>(null)
  const [comments, setComments] = useState<YunxiaoComment[]>([])
  const [parentSubject, setParentSubject] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitTestOpen, setSubmitTestOpen] = useState(false)
  const openModal = useAppStore((s) => s.openModal)

  const load = useCallback(async () => {
    const [detail, list] = await Promise.all([
      yunxiaoClient.get(workItemId),
      yunxiaoClient.comments(workItemId).catch(() => [])
    ])
    setItem(detail)
    setComments(list)
    // The requirement a task or bug hangs under, as Yunxiao shows above the title.
    setParentSubject(
      detail.parentId
        ? await yunxiaoClient
            .get(detail.parentId)
            .then((parent) => parent.subject)
            .catch(() => null)
        : null
    )
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
        {parentSubject ? (
          <div className="truncate text-xs text-muted-foreground" title={parentSubject}>
            所属需求：{parentSubject}
          </div>
        ) : null}
        <div className="text-xs text-muted-foreground">
          {item.creator?.name ?? ''} {formatFullTime(item.createdAt)} 创建
          {item.updatedAt ? `，${formatFullTime(item.updatedAt)} 更新` : ''}
        </div>
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
      <YunxiaoBaseFields
        item={item}
        onChanged={(next) => {
          setItem(next)
          onChanged(next)
        }}
      />
      <YunxiaoEffortSection
        workItemId={item.id}
        // Hours feed the list's 工时 columns: re-read the item once they change.
        onChanged={() =>
          void yunxiaoClient
            .get(item.id)
            .then(onChanged)
            .catch(() => undefined)
        }
      />
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
        onDone={() => onChanged()}
      />
    </div>
  )
}
