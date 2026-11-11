import { useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import * as HoverCardPrimitive from 'radix-ui/hover-card'
import { HoverCard, HoverCardContent } from '@/components/ui/hover-card'
import { useTranslate } from '@/i18n/use-translate'
import { cn } from '@/lib/utils'
import type { ProjectGroup } from '../../../../shared/project-group-types'
import {
  handleRepoHeaderActionPointerDown,
  stopRepoHeaderKeyboardToggle
} from '../sidebar/worktree-list/rows/header-event-guards'
import { ProjectOverviewPanel } from './ProjectOverviewPanel'

// leniu: hovering this small button (not the whole row) opens the overview; row click/expand stay as-is.
export function ProjectGroupOverviewButton({ projectGroup }: { projectGroup: ProjectGroup }) {
  const t = useTranslate()
  const [open, setOpen] = useState(false)
  const label = t('projectOverview.open', 'Workspace overview')
  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={150} closeDelay={250}>
      <HoverCardPrimitive.Trigger asChild>
        <button
          type="button"
          data-repo-header-action=""
          aria-label={label}
          className={cn(
            'inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground',
            'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
            'hover:bg-accent/70 hover:text-foreground data-[state=open]:opacity-100'
          )}
          onKeyDown={stopRepoHeaderKeyboardToggle}
          onPointerDown={handleRepoHeaderActionPointerDown}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setOpen(true)
          }}
        >
          <LayoutGrid className="size-3" />
        </button>
      </HoverCardPrimitive.Trigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="w-fit max-w-[calc(100vw-2rem)] p-4"
      >
        {open && <ProjectOverviewPanel group={projectGroup} onClose={() => setOpen(false)} />}
      </HoverCardContent>
    </HoverCard>
  )
}
