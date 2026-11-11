import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslate } from '@/i18n/use-translate'
import { useAppStore } from '@/store'

// leniu: the only manual usage refresh, kept at the far right of the sidebar toolbar, away from
// settings/help, because the status bar copy sat right beside them and was easy to hit.
export function SidebarUsageRefreshButton() {
  const t = useTranslate()
  const refreshRateLimits = useAppStore((s) => s.refreshRateLimits)
  const [refreshing, setRefreshing] = useState(false)
  const label = t('auto.components.status.bar.StatusBar.c8857b40f7', 'Refresh usage data')
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          type="button"
          aria-label={label}
          disabled={refreshing}
          className="text-muted-foreground"
          onClick={() => {
            setRefreshing(true)
            void refreshRateLimits().finally(() => setRefreshing(false))
          }}
        >
          <RefreshCw className={refreshing ? 'size-3.5 animate-spin' : 'size-3.5'} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
