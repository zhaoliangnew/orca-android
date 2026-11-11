import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useTranslate } from '@/i18n/use-translate'
import type { QuickPrompt } from '../../../../../../shared/leniu-workspace-settings'
import { fillQuickPrompt, quickPromptBlanks } from './quick-prompts'

type Props = {
  prompt: QuickPrompt | null
  onCancel: () => void
  onSend: (text: string) => void
}

// leniu: fills each 【hint】 of a quick prompt before it is sent.
export function QuickPromptFillDialog({ prompt, onCancel, onSend }: Props) {
  const t = useTranslate()
  const blanks = prompt ? quickPromptBlanks(prompt.text) : []
  const [values, setValues] = useState<string[]>([])
  const send = (): void => {
    if (prompt) {
      onSend(fillQuickPrompt(prompt.text, values))
      setValues([])
    }
  }
  return (
    <Dialog
      open={prompt !== null}
      onOpenChange={(open) => {
        if (!open) {
          setValues([])
          onCancel()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogTitle>{prompt?.label}</DialogTitle>
        <div className="flex flex-col gap-3">
          {blanks.map((hint, index) => (
            <Textarea
              key={`${index}-${hint}`}
              autoFocus={index === 0}
              rows={2}
              placeholder={hint}
              value={values[index] ?? ''}
              onChange={(event) => {
                const next = [...values]
                next[index] = event.target.value
                setValues(next)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault()
                  send()
                }
              }}
            />
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            {t('quickPrompts.cancel', 'Cancel')}
          </Button>
          <Button onClick={send}>{t('quickPrompts.send', 'Send')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
