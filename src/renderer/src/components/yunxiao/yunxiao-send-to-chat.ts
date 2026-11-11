import { useAppStore } from '@/store'
import { nativeChatComposerScopeDestination } from '@/components/native-chat/composer/focus/native-chat-composer-destination'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'

const SCOPE_SELECTOR = '[data-native-chat-composer-scope]'
const MOUNT_WAIT_MS = 350

function visibleComposerScope(): string | null {
  for (const element of document.querySelectorAll<HTMLElement>(SCOPE_SELECTOR)) {
    if (element.offsetParent !== null && element.dataset.nativeChatComposerScope) {
      return element.dataset.nativeChatComposerScope
    }
  }
  return null
}

export type YunxiaoSendResult = 'inserted' | 'copied'

/**
 * leniu: leaves the tasks page and puts the work item's context into the open chat's input (not
 * sent), linking the active workspace to the work item. Without a chat it lands on the clipboard.
 */
export async function sendYunxiaoWorkItemToChat(ref: string): Promise<YunxiaoSendResult> {
  const context = await yunxiaoClient.context(ref)
  const state = useAppStore.getState()
  const worktreeId = state.activeWorktreeId
  state.closeTaskPage()
  if (worktreeId) {
    await yunxiaoClient.linkWorkspace(worktreeId, ref).catch(() => undefined)
  }
  await new Promise((resolve) => setTimeout(resolve, MOUNT_WAIT_MS))
  const scope = visibleComposerScope()
  const composer = scope ? nativeChatComposerScopeDestination(scope) : null
  if (composer?.acceptsText()) {
    composer.appendText(context)
    composer.focus()
    return 'inserted'
  }
  await window.api.ui.writeClipboardText(context)
  return 'copied'
}
