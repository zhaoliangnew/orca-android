import { useTranslate } from '@/i18n/use-translate'

// leniu: marks the main checkout vs linked worktrees, matching the workspace overview tags.
export function WorktreeKindTag({ isMain }: { isMain: boolean }) {
  const t = useTranslate()
  return (
    <span className="shrink-0 rounded bg-foreground/10 px-1 text-[10px] leading-4 text-muted-foreground">
      {isMain ? t('projectOverview.main', 'Main') : 'tree'}
    </span>
  )
}
