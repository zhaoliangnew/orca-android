import { describe, expect, it } from 'vitest'
import { ClaudePromptSuggestionTracker } from './claude-prompt-suggestion'

describe('ClaudePromptSuggestionTracker', () => {
  it('keeps the latest suggestion until the next turn starts', () => {
    const tracker = new ClaudePromptSuggestionTracker()
    tracker.observe({ type: 'prompt_suggestion', suggestion: '  帮我提交代码 ' }, false)
    expect(tracker.value).toBe('帮我提交代码')

    tracker.observe({ type: 'assistant' }, false)
    expect(tracker.value).toBe('帮我提交代码')

    tracker.observe({ type: 'user' }, true)
    expect(tracker.value).toBeNull()
  })
})
