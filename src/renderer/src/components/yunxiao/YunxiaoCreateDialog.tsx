import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'
import {
  YUNXIAO_CATEGORIES,
  yunxiaoCategoryLabel,
  type YunxiaoCategory,
  type YunxiaoProject,
  type YunxiaoSprint
} from '../../../../shared/yunxiao/yunxiao-types'

const NO_SPRINT = '__none__'

/** leniu: a new 需求/任务/缺陷 in one of the watched projects, assigned to me. */
export function YunxiaoCreateDialog({
  open,
  onOpenChange,
  projects,
  onCreated
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: YunxiaoProject[]
  onCreated: (id: string) => void
}) {
  const [projectId, setProjectId] = useState('')
  const [category, setCategory] = useState<YunxiaoCategory>('Task')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [sprints, setSprints] = useState<YunxiaoSprint[]>([])
  const [sprintId, setSprintId] = useState(NO_SPRINT)
  const [busy, setBusy] = useState(false)

  // Until the user picks one, the first watched project.
  const effectiveProjectId = projectId || projects[0]?.id || ''

  useEffect(() => {
    if (!effectiveProjectId) {
      return
    }
    let cancelled = false
    yunxiaoClient
      .sprints(effectiveProjectId)
      .catch(() => [])
      .then((next) => {
        if (!cancelled) {
          setSprints(next)
        }
      })
    return () => {
      cancelled = true
    }
  }, [effectiveProjectId])

  const create = async (): Promise<void> => {
    setBusy(true)
    try {
      const item = await yunxiaoClient.create({
        projectId: effectiveProjectId,
        category,
        subject: subject.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(sprintId !== NO_SPRINT ? { sprintId } : {})
      })
      toast.success(`已创建 ${item.serialNumber}`)
      setSubject('')
      setDescription('')
      onOpenChange(false)
      onCreated(item.id)
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
          <DialogTitle>新建云效工作项</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as YunxiaoCategory)}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YUNXIAO_CATEGORIES.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {yunxiaoCategoryLabel(entry)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={effectiveProjectId}
              onValueChange={(next) => {
                setProjectId(next)
                setSprints([])
                setSprintId(NO_SPRINT)
              }}
            >
              <SelectTrigger className="min-w-0 flex-1">
                <SelectValue placeholder="选择项目" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={sprintId} onValueChange={setSprintId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SPRINT}>不放进迭代</SelectItem>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="标题"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
          <Textarea
            placeholder="描述（可选，支持 Markdown）"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-28 text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={busy || !effectiveProjectId || !subject.trim()}
            onClick={() => void create()}
          >
            {busy ? '创建中…' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
