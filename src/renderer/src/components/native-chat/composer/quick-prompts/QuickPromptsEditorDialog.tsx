import { useState } from 'react'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useTranslate } from '@/i18n/use-translate'
import { cn } from '@/lib/utils'
import type { QuickPrompt } from '../../../../../../shared/leniu-workspace-settings'
import { DEFAULT_QUICK_PROMPTS, groupQuickPrompts } from './quick-prompts'

type Props = {
  open: boolean
  prompts: readonly QuickPrompt[]
  onOpenChange: (open: boolean) => void
  onChange: (prompts: QuickPrompt[]) => void
}

function newPromptId(): string {
  return `custom-${Date.now().toString(36)}`
}

// leniu: add, edit and delete quick prompts; edits save immediately into Orca's settings.
export function QuickPromptsEditorDialog({ open, prompts, onOpenChange, onChange }: Props) {
  const t = useTranslate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = prompts.find((prompt) => prompt.id === selectedId) ?? prompts[0] ?? null
  const update = (patch: Partial<QuickPrompt>): void => {
    if (selected) {
      onChange(
        prompts.map((prompt) => (prompt.id === selected.id ? { ...prompt, ...patch } : prompt))
      )
    }
  }
  const add = (): void => {
    const prompt = { id: newPromptId(), label: t('quickPrompts.newLabel', 'New prompt'), text: '' }
    onChange([...prompts, prompt])
    setSelectedId(prompt.id)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[70vh] w-[860px] max-w-[94vw] grid-rows-[auto_minmax(0,1fr)] sm:max-w-[94vw]">
        <DialogTitle>{t('quickPrompts.editTitle', 'Quick prompts')}</DialogTitle>
        <div className="flex min-h-0 gap-4">
          <div className="flex w-56 shrink-0 flex-col gap-2">
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-sleek rounded-md border border-border p-1">
              {groupQuickPrompts(prompts).map(({ group, items }) => (
                <div key={group} className="mb-1">
                  <div className="px-2 py-1 text-2xs text-muted-foreground">{group}</div>
                  {items.map((prompt) => (
                    <button
                      key={prompt.id}
                      type="button"
                      className={cn(
                        'block w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-accent/60',
                        prompt.id === selected?.id && 'bg-accent text-accent-foreground'
                      )}
                      onClick={() => setSelectedId(prompt.id)}
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Button size="xs" variant="outline" className="flex-1" onClick={add}>
                <Plus className="size-3" />
                {t('quickPrompts.add', 'Add')}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                title={t('quickPrompts.reset', 'Restore defaults')}
                onClick={() => onChange(DEFAULT_QUICK_PROMPTS.map((prompt) => ({ ...prompt })))}
              >
                <RotateCcw className="size-3" />
              </Button>
            </div>
          </div>
          {selected ? (
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  value={selected.label}
                  placeholder={t('quickPrompts.label', 'Button text')}
                  onChange={(event) => update({ label: event.target.value })}
                  className="h-8 flex-1 text-sm"
                />
                <Input
                  value={selected.group ?? ''}
                  placeholder={t('quickPrompts.group', 'Group (empty = 我的)')}
                  onChange={(event) => update({ group: event.target.value })}
                  className="h-8 w-40 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={selected.confirm === true}
                  onCheckedChange={(confirm) => update({ confirm })}
                />
                {t('quickPrompts.confirm', 'Click twice to send (for commit, push, install…)')}
              </label>
              <Textarea
                value={selected.text}
                placeholder={t(
                  'quickPrompts.textHint',
                  'Message sent to the AI; 【hint】 becomes a blank to fill'
                )}
                onChange={(event) => update({ text: event.target.value })}
                className="min-h-0 flex-1 resize-none font-mono text-xs"
              />
              <Button
                size="xs"
                variant="ghost"
                className="self-end text-destructive"
                onClick={() => {
                  onChange(prompts.filter((prompt) => prompt.id !== selected.id))
                  setSelectedId(null)
                }}
              >
                <Trash2 className="size-3" />
                {t('quickPrompts.delete', 'Delete')}
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
