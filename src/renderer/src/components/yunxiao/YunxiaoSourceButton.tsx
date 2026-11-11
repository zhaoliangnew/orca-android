import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useYunxiaoPage } from './yunxiao-page-store'

/** leniu: the tasks page's 云效 source button, beside GitHub/GitLab/Linear/Jira. */
export function YunxiaoSourceButton() {
  const open = useYunxiaoPage((s) => s.open)
  const setOpen = useYunxiaoPage((s) => s.setOpen)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="云效"
          aria-pressed={open}
          onClick={() => setOpen(true)}
          className={cn(
            'flex h-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition',
            open
              ? 'border-foreground/40 bg-muted/70 text-foreground shadow-sm'
              : 'border-border/40 bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground'
          )}
        >
          云效
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        云效工作项
      </TooltipContent>
    </Tooltip>
  )
}
