import type { QuickPrompt } from '../../../../../../shared/leniu-workspace-settings'
import defaultQuickPrompts from './default-quick-prompts.json'

export const DEFAULT_QUICK_PROMPTS: readonly QuickPrompt[] = defaultQuickPrompts
export const MY_QUICK_PROMPT_GROUP = '我的'
const BUILT_IN_GROUP_ORDER = ['代码', '分析', '设计', '会话', '提交发布', '钉钉']

/** Built-in groups first, custom groups next, ungrouped ("我的") last; items keep their order. */
export function groupQuickPrompts(
  prompts: readonly QuickPrompt[]
): { group: string; items: QuickPrompt[] }[] {
  const groups = new Map<string, QuickPrompt[]>()
  for (const prompt of prompts) {
    const group = prompt.group?.trim() || MY_QUICK_PROMPT_GROUP
    groups.set(group, [...(groups.get(group) ?? []), prompt])
  }
  const rank = (group: string): number => {
    const index = BUILT_IN_GROUP_ORDER.indexOf(group)
    return index !== -1 ? index : group === MY_QUICK_PROMPT_GROUP ? 1000 : 500
  }
  return [...groups]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([group, items]) => ({ group, items }))
}

/** Each 【…】 is a blank the user fills before sending; its inner text is the hint. */
export function quickPromptBlanks(text: string): string[] {
  return [...text.matchAll(/【([^】]*)】/g)].map((match) => match[1])
}

export function fillQuickPrompt(text: string, values: readonly string[]): string {
  let index = 0
  return text.replace(/【[^】]*】/g, () => values[index++] ?? '')
}
