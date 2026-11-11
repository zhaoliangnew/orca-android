import { useState, type DragEvent } from 'react'
import { Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useTranslate } from '@/i18n/use-translate'
import { cn } from '@/lib/utils'
import { formatOverviewVisit } from './project-overview-layout'
import type { OverviewCheckout, OverviewProduct } from './use-project-overview-products'

export const OVERVIEW_CARD_DRAG_TYPE = 'application/x-orca-overview-card'

type Props = {
  index: number
  product: OverviewProduct
  dropEdge: 'before' | 'after' | null
  onOpen: (checkout: OverviewCheckout) => void
  onAliasChange: (alias: string) => void
  onDragOverCard: (event: DragEvent<HTMLDivElement>) => void
}

function CheckoutTag({ isMain }: { isMain: boolean }) {
  const t = useTranslate()
  return (
    <span className="w-10 shrink-0 rounded bg-foreground/10 px-1 text-center text-[10px] text-muted-foreground">
      {isMain ? t('projectOverview.main', 'Main') : 'tree'}
    </span>
  )
}

function CheckoutRow({ checkout, onOpen }: { checkout: OverviewCheckout; onOpen: () => void }) {
  return (
    <button
      type="button"
      className="flex h-7 w-full items-center gap-2 rounded-md pr-2 pl-8 text-left text-[12.5px] hover:bg-accent/60 hover:text-sky-400"
      onClick={onOpen}
    >
      <CheckoutTag isMain={checkout.isMain} />
      <span className={cn('min-w-0 flex-1 truncate', checkout.active && 'font-semibold')}>
        {checkout.label}
      </span>
      <span className="shrink-0 text-[11px] text-muted-foreground">
        {formatOverviewVisit(checkout.visitedAt)}
      </span>
    </button>
  )
}

// leniu: one product card — header drags between columns; each checkout row switches workspace.
export function ProjectOverviewCard({
  index,
  product,
  dropEdge,
  onOpen,
  onAliasChange,
  onDragOverCard
}: Props) {
  const t = useTranslate()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const save = (): void => {
    onAliasChange(draft)
    setEditing(false)
  }
  return (
    <div
      className={cn(
        'group/card relative rounded-lg border border-foreground/[0.08]',
        dropEdge === 'before' &&
          'before:absolute before:inset-x-0 before:-top-1.5 before:h-0.5 before:bg-sky-400',
        dropEdge === 'after' &&
          'after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:bg-sky-400'
      )}
      onDragOver={onDragOverCard}
    >
      <div
        draggable={!editing}
        onDragStart={(event) => event.dataTransfer.setData(OVERVIEW_CARD_DRAG_TYPE, product.name)}
        className="flex min-h-10 cursor-grab items-center gap-2 rounded-t-lg bg-foreground/[0.035] px-2 py-1.5"
      >
        <span className="w-4 shrink-0 text-right text-[11.5px] text-muted-foreground">{index}</span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              autoFocus
              value={draft}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  save()
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  event.stopPropagation()
                  setEditing(false)
                }
              }}
              onBlur={save}
              placeholder={t('projectOverview.aliasPlaceholder', 'Chinese name')}
              className="h-6 text-xs"
            />
          ) : (
            <div className="flex min-w-0 items-baseline gap-2">
              {product.scope && (
                <span className="shrink-0 text-[11px] text-muted-foreground">{product.scope}</span>
              )}
              <span className="truncate text-sm font-semibold">
                {product.alias ?? product.folder}
              </span>
              {product.alias && (
                <span className="truncate text-[11px] text-muted-foreground">{product.folder}</span>
              )}
            </div>
          )}
        </div>
        {!editing && (
          <button
            type="button"
            aria-label={t('projectOverview.editAlias', 'Edit name')}
            className="invisible inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground group-hover/card:visible hover:text-foreground"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              setDraft(product.alias ?? '')
              setEditing(true)
            }}
          >
            <Pencil className="size-3" />
          </button>
        )}
      </div>
      <div className="py-1">
        {product.checkouts.map((checkout) => (
          <CheckoutRow
            key={checkout.worktree.id}
            checkout={checkout}
            onOpen={() => onOpen(checkout)}
          />
        ))}
      </div>
    </div>
  )
}
