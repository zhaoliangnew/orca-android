import { useEffect, useRef, useState } from 'react'
import * as HoverCardPrimitive from 'radix-ui/hover-card'
import {
  Bell,
  BookOpen,
  Bug,
  CircleCheck,
  ClipboardList,
  Code2,
  FileSearch,
  FolderSearch,
  GitCommitHorizontal,
  Lightbulb,
  MessageSquare,
  MessageSquareText,
  Package,
  Palette,
  Play,
  RefreshCw,
  Send,
  Settings,
  Upload,
  Wand2,
  Wrench,
  Zap,
  type LucideIcon
} from 'lucide-react'
import { HoverCard, HoverCardContent } from '@/components/ui/hover-card'
import { useTranslate } from '@/i18n/use-translate'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import type { QuickPrompt } from '../../../../../../shared/leniu-workspace-settings'
import { DEFAULT_QUICK_PROMPTS, groupQuickPrompts, quickPromptBlanks } from './quick-prompts'
import { sendQuickPrompt } from './send-quick-prompt'
import { QuickPromptFillDialog } from './QuickPromptFillDialog'
import { QuickPromptsEditorDialog } from './QuickPromptsEditorDialog'

const CONFIRM_WINDOW_MS = 3000
const PROMPT_ICONS: Record<string, LucideIcon> = {
  review: Code2,
  fix: Wrench,
  verify: CircleCheck,
  debug: Bug,
  plan: Lightbulb,
  'req-review': FileSearch,
  explain: BookOpen,
  project: FolderSearch,
  design: Palette,
  'design-polish': Wand2,
  sync: RefreshCw,
  continue: Play,
  summary: ClipboardList,
  commit: GitCommitHorizontal,
  push: Upload,
  install: Package,
  'dt-check': MessageSquareText,
  'dt-reply': Send,
  'notify-test': Bell
}

function PromptItem({
  prompt,
  armed,
  onChoose
}: {
  prompt: QuickPrompt
  armed: boolean
  onChoose: () => void
}) {
  const t = useTranslate()
  const Icon = PROMPT_ICONS[prompt.id] ?? MessageSquare
  return (
    <button
      type="button"
      className="flex w-full gap-2 rounded-md px-1.5 py-1 text-left hover:bg-accent/70"
      onClick={onChoose}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-xs font-medium', armed && 'text-orange-500')}>
          {armed
            ? t('quickPrompts.clickAgain', 'Click again to send: {{value}}', {
                value: prompt.label
              })
            : prompt.label}
        </span>
        <span className="block truncate text-2xs text-muted-foreground">
          {prompt.text.split('\n')[0]}
        </span>
      </span>
    </button>
  )
}

// leniu: grouped saved prompts opened by hovering the button; one click sends to this chat.
export function NativeChatQuickPromptsMenu() {
  const t = useTranslate()
  const saved = useAppStore((s) => s.settings?.quickPrompts)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const prompts = saved ?? DEFAULT_QUICK_PROMPTS
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [armedId, setArmedId] = useState<string | null>(null)
  const [filling, setFilling] = useState<QuickPrompt | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!armedId) {
      return
    }
    const timer = setTimeout(() => setArmedId(null), CONFIRM_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [armedId])

  const choose = (prompt: QuickPrompt): void => {
    if (prompt.confirm && armedId !== prompt.id) {
      setArmedId(prompt.id)
      return
    }
    setArmedId(null)
    setOpen(false)
    if (quickPromptBlanks(prompt.text).length > 0) {
      setFilling(prompt)
      return
    }
    sendQuickPrompt(triggerRef.current, prompt.text)
  }

  return (
    <>
      <HoverCard
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setArmedId(null)
          }
        }}
        openDelay={120}
        closeDelay={250}
      >
        <HoverCardPrimitive.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
            className="inline-flex h-6 items-center gap-1 rounded-md border border-border px-2 text-sm whitespace-nowrap text-chat-foreground hover:bg-accent/60 hover:text-foreground"
            onClick={() => setOpen(true)}
          >
            <Zap className="size-3.5" />
            {t('quickPrompts.title', 'Quick prompts')}
          </button>
        </HoverCardPrimitive.Trigger>
        <HoverCardContent
          side="top"
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className="w-[520px] max-w-[calc(100vw-2rem)] p-2"
        >
          <div className="max-h-[min(560px,70vh)] columns-2 gap-2 overflow-y-auto scrollbar-sleek">
            {groupQuickPrompts(prompts).map(({ group, items }) => (
              <div
                key={group}
                className="mb-2 break-inside-avoid rounded-lg bg-foreground/[0.04] p-1.5"
              >
                <div className="mb-1 flex items-center gap-1.5 px-1 text-2xs font-semibold">
                  <span className="h-3 w-0.5 rounded bg-sky-500" />
                  {group}
                </div>
                {items.map((prompt) => (
                  <PromptItem
                    key={prompt.id}
                    prompt={prompt}
                    armed={armedId === prompt.id}
                    onChoose={() => choose(prompt)}
                  />
                ))}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-border px-2 pt-2 pb-1 text-left text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setOpen(false)
              setEditing(true)
            }}
          >
            <Settings className="size-3.5" />
            {t('quickPrompts.edit', 'Edit quick prompts…')}
          </button>
        </HoverCardContent>
      </HoverCard>
      <QuickPromptFillDialog
        prompt={filling}
        onCancel={() => setFilling(null)}
        onSend={(text) => {
          setFilling(null)
          sendQuickPrompt(triggerRef.current, text)
        }}
      />
      <QuickPromptsEditorDialog
        open={editing}
        prompts={prompts}
        onOpenChange={setEditing}
        onChange={(next) => void updateSettings({ quickPrompts: next })}
      />
    </>
  )
}
