import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'
import type { YunxiaoWorkItemDetail } from '../../../../shared/yunxiao/yunxiao-types'

const NOTE_TEMPLATE = '公司内已测：\n- \n\n需要现场测：\n- '

/**
 * leniu: 提测 — a 任务「提测：<需求>」under the requirement, same sprint, assigned to me; then the
 * requirement's owner gets the link on DingTalk.
 */
export function YunxiaoSubmitTestDialog({
  open,
  onOpenChange,
  requirement,
  onDone
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  requirement: YunxiaoWorkItemDetail
  onDone: () => void
}) {
  const [note, setNote] = useState(NOTE_TEMPLATE)
  const [busy, setBusy] = useState(false)
  const owner = requirement.assignedTo?.name ?? '未指派'

  const submit = async (): Promise<void> => {
    setBusy(true)
    try {
      const result = await yunxiaoClient.submitTest(requirement.id, note)
      toast.success(`已建提测单 ${result.task.serialNumber}`)
      if (result.notified) {
        toast.success(`已钉钉通知 ${result.owner?.name}`)
      } else if (result.notifyError) {
        toast.message(`没有发钉钉：${result.notifyError}`)
      }
      onOpenChange(false)
      setNote(NOTE_TEMPLATE)
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>提测：{requirement.subject}</DialogTitle>
          <DialogDescription>
            在这个需求下建一个任务「提测：{requirement.subject}」，放在同一个迭代
            {requirement.sprint ? `（${requirement.sprint.name}）` : ''}
            ，指派给你；建好后钉钉通知需求负责人
            {owner}。
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="min-h-36 text-sm"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? '提测中…' : '建提测单并通知'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
