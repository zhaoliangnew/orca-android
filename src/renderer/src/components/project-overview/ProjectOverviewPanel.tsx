import { useState, type DragEvent } from 'react'
import { GripVertical, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useTranslate } from '@/i18n/use-translate'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { jumpToWorktreeFromSidebar } from '@/lib/workspace/activation/worktree-jump-navigation'
import type { ProjectGroup } from '../../../../shared/project-group-types'
import type { ProjectOverviewColumn } from '../../../../shared/leniu-workspace-settings'
import { OVERVIEW_CARD_DRAG_TYPE, ProjectOverviewCard } from './ProjectOverviewCard'
import {
  autoOverviewColumns,
  moveOverviewCard,
  moveOverviewColumn,
  resolveOverviewColumns
} from './project-overview-layout'
import { useProjectOverviewProducts, type OverviewCheckout } from './use-project-overview-products'

const COLUMN_DRAG_TYPE = 'application/x-orca-overview-column'
type CardTarget = { column: number; name: string | null; after: boolean }

function ColumnTitle({ title, onRename }: { title: string; onRename: (title: string) => void }) {
  const t = useTranslate()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  if (editing) {
    const save = (): void => {
      onRename(draft.trim())
      setEditing(false)
    }
    return (
      <Input
        autoFocus
        value={draft}
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
        className="h-6 w-36 text-xs"
      />
    )
  }
  return (
    <button
      type="button"
      className={cn('truncate text-xs font-semibold', !title && 'text-muted-foreground')}
      onClick={() => {
        setDraft(title)
        setEditing(true)
      }}
    >
      {title || t('projectOverview.untitled', 'Untitled group')}
    </button>
  )
}

// leniu: wide overview of a folder group's products, arranged in user-named draggable columns.
export function ProjectOverviewPanel({
  group,
  onClose
}: {
  group: ProjectGroup
  onClose: () => void
}) {
  const t = useTranslate()
  const products = useProjectOverviewProducts(group)
  const layouts = useAppStore((s) => s.settings?.projectOverviewLayouts)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [cardTarget, setCardTarget] = useState<CardTarget | null>(null)
  const [columnTarget, setColumnTarget] = useState<{ index: number; after: boolean } | null>(null)
  const byName = new Map(products.map((product) => [product.name, product]))
  const columns = resolveOverviewColumns(
    products.map((product) => product.name),
    layouts?.[group.id],
    autoOverviewColumns(products.map((p) => ({ name: p.name, rows: p.checkouts.length })))
  )
  const save = (next: ProjectOverviewColumn[]): void => {
    void updateSettings({ projectOverviewLayouts: { ...layouts, [group.id]: next } })
  }
  const saveAlias = (name: string, alias: string): void => {
    const productAliases = { ...useAppStore.getState().settings?.productAliases, [name]: alias }
    void updateSettings({ productAliases })
  }
  const open = (checkout: OverviewCheckout): void => {
    onClose()
    jumpToWorktreeFromSidebar(checkout.worktree.id, { executionHostId: checkout.worktree.hostId })
  }
  const dropOnColumn = (event: DragEvent, column: number): void => {
    const name = event.dataTransfer.getData(OVERVIEW_CARD_DRAG_TYPE)
    const from = Number(event.dataTransfer.getData(COLUMN_DRAG_TYPE) || Number.NaN)
    if (name) {
      const target = cardTarget?.column === column ? cardTarget : null
      save(moveOverviewCard(columns, name, column, target?.name ?? null, target?.after ?? false))
    } else if (!Number.isNaN(from) && columnTarget) {
      save(moveOverviewColumn(columns, from, columnTarget.index, columnTarget.after))
    }
    setCardTarget(null)
    setColumnTarget(null)
  }
  let number = 0
  return (
    <div className="flex max-h-[calc(100vh-4rem)] min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2 pr-8">
        <span className="text-sm font-semibold">{group.name}</span>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => save([...columns, { title: '', names: [] }])}
        >
          <Plus className="size-3" />
          {t('projectOverview.newGroup', 'New group')}
        </button>
      </div>
      <div className="flex min-h-0 gap-3 overflow-auto scrollbar-sleek pb-1">
        {columns.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className={cn(
              'relative flex w-max min-w-56 shrink-0 flex-col gap-2 rounded-lg',
              cardTarget?.column === columnIndex && !cardTarget.name && 'bg-sky-400/[0.06]',
              columnTarget?.index === columnIndex &&
                (columnTarget.after ? 'border-r-2 border-sky-400' : 'border-l-2 border-sky-400')
            )}
            onDragOver={(event) => {
              event.preventDefault()
              if (event.dataTransfer.types.includes(COLUMN_DRAG_TYPE)) {
                const rect = event.currentTarget.getBoundingClientRect()
                const after = event.clientX > rect.left + rect.width / 2
                setColumnTarget({ index: columnIndex, after })
              } else if (event.target === event.currentTarget) {
                setCardTarget({ column: columnIndex, name: null, after: false })
              }
            }}
            onDrop={(event) => dropOnColumn(event, columnIndex)}
          >
            <div className="flex items-center gap-1 px-1">
              <span
                draggable
                onDragStart={(event) =>
                  event.dataTransfer.setData(COLUMN_DRAG_TYPE, String(columnIndex))
                }
                className="cursor-grab text-muted-foreground"
              >
                <GripVertical className="size-3.5" />
              </span>
              <ColumnTitle
                title={column.title}
                onRename={(title) =>
                  save(columns.map((item, i) => (i === columnIndex ? { ...item, title } : item)))
                }
              />
              {column.names.length === 0 && columns.length > 1 && (
                <button
                  type="button"
                  aria-label={t('projectOverview.deleteGroup', 'Delete group')}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                  onClick={() => save(columns.filter((_, i) => i !== columnIndex))}
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
            {column.names.length === 0 && (
              <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                {t('projectOverview.dropHere', 'Drag products here')}
              </div>
            )}
            {column.names.map((name) => {
              const product = byName.get(name)
              if (!product) {
                return null
              }
              number += 1
              return (
                <ProjectOverviewCard
                  key={name}
                  index={number}
                  product={product}
                  dropEdge={
                    cardTarget?.column === columnIndex && cardTarget.name === name
                      ? cardTarget.after
                        ? 'after'
                        : 'before'
                      : null
                  }
                  onOpen={open}
                  onAliasChange={(alias) => saveAlias(product.folder, alias)}
                  onDragOverCard={(event) => {
                    if (!event.dataTransfer.types.includes(OVERVIEW_CARD_DRAG_TYPE)) {
                      return
                    }
                    event.preventDefault()
                    const rect = event.currentTarget.getBoundingClientRect()
                    const after = event.clientY > rect.top + rect.height / 2
                    setCardTarget({ column: columnIndex, name, after })
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
