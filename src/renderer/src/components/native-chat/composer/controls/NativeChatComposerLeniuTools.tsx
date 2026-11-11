import { useEffect, useRef, useState, type ReactNode } from 'react'
import { create } from 'zustand'
import { ChartColumn, History, SquarePen } from 'lucide-react'
import { useAppStore } from '@/store'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { launchAgentInNewTab } from '@/lib/agent-session/launch/new-tab/launch-agent-in-new-tab'
import { newAgentLaunchRequestId } from '@/lib/agent-session/launch/routing/agent-launch-request-id'
import { captureAgentTabLaunchContext } from '@/components/agent-tab-launch-context'
import { NativeChatUsagePopup } from './NativeChatUsagePopup'
import { isTuiAgent } from '../../../../../../shared/agent-launch/catalog/tui-agent-config'
import type { NativeChatContextUsageSummary } from '../../../../../../shared/native-chat/native-chat-context-usage-summary'
import { NativeChatContextUsageRing } from '../../usage/NativeChatContextUsageRing'
import { NativeChatRecentSettings } from '../recent/NativeChatRecentSettings'

export type NativeChatLeniuTools = {
  /** Sends /compact to the session; absent for chats without a structured session. */
  compact?: () => void
  worktreeId?: string
}

const SCOPE_SELECTOR = '[data-native-chat-composer-scope]'
// The workspace footer knows the session; the toolbar does not. Both sit in one composer scope, so
// the footer publishes the tools under that scope and the toolbar reads them back.
const useToolsByScope = create<Record<string, NativeChatLeniuTools>>(() => ({}))

function useComposerScope(): [React.RefObject<HTMLSpanElement | null>, string | undefined] {
  const ref = useRef<HTMLSpanElement>(null)
  const [scope, setScope] = useState<string>()
  useEffect(() => {
    setScope(ref.current?.closest<HTMLElement>(SCOPE_SELECTOR)?.dataset.nativeChatComposerScope)
  }, [])
  return [ref, scope]
}

export function NativeChatLeniuToolsSource({
  dispatchCommand,
  worktreeId
}: {
  dispatchCommand?: (text: string) => unknown
  worktreeId?: string
}) {
  const [ref, scope] = useComposerScope()
  useEffect(() => {
    if (!scope) {
      return
    }
    const compact = dispatchCommand ? () => void dispatchCommand('/compact') : undefined
    useToolsByScope.setState({ [scope]: { compact, worktreeId } })
    return () => {
      useToolsByScope.setState((all) => {
        const { [scope]: _removed, ...rest } = all
        return rest
      }, true)
    }
  }, [scope, dispatchCommand, worktreeId])
  return <span ref={ref} hidden />
}

// Small text buttons, as in Android Dev's composer bar.
const TOOL_TEXT =
  'flex h-6 shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-sm text-chat-foreground-faint transition-colors hover:bg-accent/60 hover:text-chat-foreground disabled:cursor-default disabled:opacity-50'

function ToolPopover({
  icon,
  label,
  onOpen,
  className,
  children
}: {
  icon: ReactNode
  label: string
  onOpen?: () => void
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          onOpen?.()
        }
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" title={label} className={TOOL_TEXT}>
          {icon}
          <span>{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className={className}>
        {children}
      </PopoverContent>
    </Popover>
  )
}

/**
 * leniu: Android Dev's composer bar extras — 最近, 用量, context + 压缩, 新会话 — set out in the
 * toolbar instead of behind menus. Without a workspace footer (edits) only the context ring shows.
 */
export function NativeChatComposerLeniuTools({
  agent,
  contextUsage,
  isWorking
}: {
  agent?: string
  contextUsage?: NativeChatContextUsageSummary | null
  isWorking: boolean
}) {
  const refreshRateLimits = useAppStore((s) => s.refreshRateLimits)
  const [ref, scope] = useComposerScope()
  const tools = useToolsByScope((all) => (scope ? all[scope] : undefined))
  const { compact, worktreeId } = tools ?? {}
  return (
    <span ref={ref} className="flex shrink-0 items-center">
      {tools && (
        <>
          <ToolPopover
            icon={<History className="size-3.5" />}
            label="最近"
            className="w-64 rounded-xl border-border/60 bg-muted p-4 shadow-xl"
          >
            <NativeChatRecentSettings />
          </ToolPopover>
          <ToolPopover
            icon={<ChartColumn className="size-3.5" />}
            label="用量"
            // Opening the panel is the user asking for fresh numbers.
            onOpen={() => void refreshRateLimits()}
            className="w-80 rounded-xl border-border/60 bg-muted p-4 shadow-xl"
          >
            <NativeChatUsagePopup agent={agent} />
          </ToolPopover>
        </>
      )}
      {contextUsage && <NativeChatContextUsageRing usage={contextUsage} />}
      {compact && (
        <button
          type="button"
          title={isWorking ? '本轮结束后可压缩上下文' : '压缩上下文'}
          disabled={isWorking}
          className={cn(TOOL_TEXT, contextUsage && 'pl-1')}
          onClick={compact}
        >
          {contextUsage ? `${Math.round(contextUsage.percentage)}% 压缩` : '压缩'}
        </button>
      )}
      {worktreeId && agent && isTuiAgent(agent) && (
        <button
          type="button"
          title="开一个新会话"
          className={TOOL_TEXT}
          onClick={() => {
            const { groupId, focusIntent } = captureAgentTabLaunchContext(worktreeId)
            launchAgentInNewTab({
              requestId: newAgentLaunchRequestId(),
              focusIntent,
              agent,
              worktreeId,
              groupId,
              launchSource: 'tab_bar_quick_launch'
            })
          }}
        >
          <SquarePen className="size-3.5" />
          <span>新会话</span>
        </button>
      )}
    </span>
  )
}
