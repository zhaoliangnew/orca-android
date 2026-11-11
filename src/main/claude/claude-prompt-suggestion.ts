/**
 * leniu: the latest `prompt_suggestion` Claude predicted for the user's next message. It arrives
 * after a turn's result and is cleared as soon as the next turn starts.
 */
export class ClaudePromptSuggestionTracker {
  value: string | null = null

  observe(message: Record<string, unknown>, startsTurn: boolean): void {
    if (message.type === 'prompt_suggestion' && typeof message.suggestion === 'string') {
      this.value = message.suggestion.trim() || null
    } else if (startsTurn) {
      this.value = null
    }
  }
}
