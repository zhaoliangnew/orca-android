import { useCallback, useEffect, useRef, useState } from 'react'
import { callStructuredAgentSession } from '@/runtime/native-chat/requests/structured-agent-session-call'
import type { RuntimeClientTarget } from '../../../../../../shared/runtime-client-target'
import { nativeChatComposerScopeDestination } from '../focus/native-chat-composer-destination'
import { readNativeChatComposerDraft } from '../../drafts/native-chat-composer-draft-store'
import './native-chat-prompt-suggestion.css'

// The suggestion lands shortly after a turn's result; poll briefly, then wait for the next turn.
const POLL_DELAYS_MS = [600, 1200, 2000, 3000, 4500, 6500, 9000]
const SCOPE_SELECTOR = '[data-native-chat-composer-scope]'

type Props = { sessionId: string; runtimeEnvironmentId: string | null; isWorking: boolean }

function useSuggestion({ sessionId, runtimeEnvironmentId, isWorking }: Props): {
  suggestion: string | null
  clear: () => void
} {
  const [suggestion, setSuggestion] = useState<string | null>(null)
  useEffect(() => {
    setSuggestion(null)
    if (isWorking) {
      return
    }
    const target: RuntimeClientTarget = runtimeEnvironmentId
      ? { kind: 'environment', environmentId: runtimeEnvironmentId }
      : { kind: 'local' }
    let cancelled = false
    const timers = POLL_DELAYS_MS.map((delay) =>
      setTimeout(() => {
        void callStructuredAgentSession<string | null>(target, 'agentSession.promptSuggestion', {
          sessionId
        })
          .then((next) => {
            if (!cancelled && next) {
              setSuggestion(next)
              cancelled = true
            }
          })
          // Hosts without the method (other providers, older servers) simply never suggest.
          .catch(() => {})
      }, delay)
    )
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [sessionId, runtimeEnvironmentId, isWorking])
  const clear = useCallback(() => setSuggestion(null), [])
  return { suggestion, clear }
}

/**
 * leniu: Claude's predicted next prompt as the empty composer's ghost text; Tab accepts it.
 * Drives the editor's placeholder through a CSS variable on the composer scope, so the over-length
 * composer components stay untouched.
 */
export function NativeChatPromptSuggestion(props: Props) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const { suggestion, clear } = useSuggestion(props)

  useEffect(() => {
    const root = anchorRef.current?.closest<HTMLElement>(SCOPE_SELECTOR)
    const scope = root?.dataset.nativeChatComposerScope
    if (!root || !scope || !suggestion) {
      return
    }
    root.dataset.leniuPromptSuggestion = ''
    root.style.setProperty('--leniu-prompt-suggestion', JSON.stringify(suggestion))
    const onKeyDown = (event: KeyboardEvent): void => {
      const composer = nativeChatComposerScopeDestination(scope)
      if (
        event.key !== 'Tab' ||
        event.shiftKey ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        !composer?.contains(event.target as Node) ||
        readNativeChatComposerDraft(scope).text.trim() !== ''
      ) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      composer.insertTypedText(suggestion)
      clear()
    }
    root.addEventListener('keydown', onKeyDown, true)
    return () => {
      root.removeEventListener('keydown', onKeyDown, true)
      delete root.dataset.leniuPromptSuggestion
      root.style.removeProperty('--leniu-prompt-suggestion')
    }
  }, [suggestion, clear])

  return <span ref={anchorRef} hidden />
}
