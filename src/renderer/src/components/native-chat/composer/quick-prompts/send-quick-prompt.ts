import { nativeChatComposerScopeDestination } from '../focus/native-chat-composer-destination'
import { readNativeChatComposerDraft } from '../../drafts/native-chat-composer-draft-store'
import { insertNativeChatComposerDraftText } from '../../drafts/native-chat-composer-draft-insertion'

/**
 * leniu: sends a quick prompt through the composer next to `anchor`, exactly like typing it and
 * pressing Enter. When the user already has a draft, the prompt is only inserted so nothing is lost.
 */
export function sendQuickPrompt(anchor: Element | null, text: string): void {
  const scope = anchor?.closest<HTMLElement>('[data-native-chat-composer-scope]')?.dataset
    .nativeChatComposerScope
  if (!scope) {
    return
  }
  const composer = nativeChatComposerScopeDestination(scope)
  const hasDraft = readNativeChatComposerDraft(scope).text.trim().length > 0
  if (!composer?.acceptsText()) {
    insertNativeChatComposerDraftText(scope, text)
    return
  }
  composer.focus()
  composer.insertTypedText(text)
  if (hasDraft || !composer.submit) {
    return
  }
  // send() reads the draft from its last render, so submit after React applies the insertion.
  requestAnimationFrame(() => requestAnimationFrame(() => composer.submit?.()))
}
