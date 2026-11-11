import { describe, expect, it } from 'vitest'
import { fillQuickPrompt, groupQuickPrompts, quickPromptBlanks } from './quick-prompts'

describe('quick prompts', () => {
  it('fills each 【hint】 blank in order', () => {
    const text = '帮我排查:【问题现象】,设备【IP】'
    expect(quickPromptBlanks(text)).toEqual(['问题现象', 'IP'])
    expect(fillQuickPrompt(text, ['白屏', '9.184'])).toBe('帮我排查:白屏,设备9.184')
  })

  it('orders built-in groups first and ungrouped prompts last', () => {
    const groups = groupQuickPrompts([
      { id: 'a', label: 'mine', text: '' },
      { id: 'b', label: 'push', text: '', group: '提交发布' },
      { id: 'c', label: 'review', text: '', group: '代码' }
    ])
    expect(groups.map((item) => item.group)).toEqual(['代码', '提交发布', '我的'])
  })
})
