import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useTranslate } from '@/i18n/use-translate'
import { cn } from '@/lib/utils'

type Props = {
  keywords: string[]
  counts: Map<string, number>
  active: string | null
  onActiveChange: (keyword: string | null) => void
  onKeywordsChange: (keywords: string[]) => void
}

// leniu: remark-category chips ("出入库 5", "取餐柜 3") that filter the device table.
export function EmulatorDeviceKeywordBar({
  keywords,
  counts,
  active,
  onActiveChange,
  onKeywordsChange
}: Props) {
  const t = useTranslate()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const chipClass = (selected: boolean) =>
    cn(
      'group/chip inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs',
      selected
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border text-muted-foreground hover:text-foreground'
    )
  const commit = (): void => {
    const keyword = draft.trim()
    if (keyword && !keywords.includes(keyword)) {
      onKeywordsChange([...keywords, keyword])
    }
    setDraft('')
    setAdding(false)
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-2 py-1.5">
      <span className="text-xs text-muted-foreground">
        {t('emulator.picker.category', 'Category')}
      </span>
      <button
        type="button"
        className={chipClass(active === null)}
        onClick={() => onActiveChange(null)}
      >
        {t('emulator.picker.all', 'All')}
      </button>
      {keywords.map((keyword) => (
        <span key={keyword} className={chipClass(active === keyword)}>
          <button type="button" onClick={() => onActiveChange(active === keyword ? null : keyword)}>
            {keyword} {counts.get(keyword) ?? 0}
          </button>
          <button
            type="button"
            aria-label={t('emulator.picker.removeCategory', 'Remove {{value}}', { value: keyword })}
            className="hidden group-hover/chip:inline-flex"
            onClick={() => {
              onKeywordsChange(keywords.filter((item) => item !== keyword))
              if (active === keyword) {
                onActiveChange(null)
              }
            }}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {adding ? (
        <Input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation()
            if (event.key === 'Enter') {
              commit()
            } else if (event.key === 'Escape') {
              event.preventDefault()
              setAdding(false)
            }
          }}
          onBlur={commit}
          placeholder={t('emulator.picker.categoryPlaceholder', 'Keyword')}
          className="h-6 w-24 text-xs"
        />
      ) : (
        <button
          type="button"
          aria-label={t('emulator.picker.addCategory', 'Add category')}
          className="inline-flex size-6 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-3" />
        </button>
      )}
    </div>
  )
}
