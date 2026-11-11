import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import { DEFAULT_RECENT_COUNT } from './NativeChatRecentSwitchList'

const MIN_COUNT = 0
const MAX_COUNT = 10

/** leniu: the 最近 button's panel — how many recent rows sit under the composer, and clear them. */
export function NativeChatRecentSettings() {
  const count = useAppStore((s) => s.settings?.recentSwitchCount ?? DEFAULT_RECENT_COUNT)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const setCount = (next: number): void => {
    void updateSettings({ recentSwitchCount: Math.min(MAX_COUNT, Math.max(MIN_COUNT, next)) })
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold text-chat-foreground-strong">最近</div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-chat-foreground">显示条数</span>
        <div className="flex items-center gap-1">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="减少"
            disabled={count <= MIN_COUNT}
            onClick={() => setCount(count - 1)}
          >
            <Minus />
          </Button>
          <span className="w-6 text-center tabular-nums">{count}</span>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="增加"
            disabled={count >= MAX_COUNT}
            onClick={() => setCount(count + 1)}
          >
            <Plus />
          </Button>
        </div>
      </div>
      <div className="text-xs text-chat-foreground-faint">
        设为 0 就不在输入框下面显示最近。单条可以鼠标移上去点 × 移除。
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => void updateSettings({ recentSwitchClearedAt: Date.now() })}
      >
        清空最近
      </Button>
    </div>
  )
}
