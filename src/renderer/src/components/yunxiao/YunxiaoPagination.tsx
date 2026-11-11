import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const YUNXIAO_PAGE_SIZE = 50

/** leniu: 共 N 条 · 第 p/n 页 under the Yunxiao list. */
export function YunxiaoPagination({
  total,
  page,
  onPage
}: {
  total: number
  page: number
  onPage: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / YUNXIAO_PAGE_SIZE))
  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-t border-border/50 px-3 text-xs text-muted-foreground">
      <span>共 {total} 条</span>
      <div className="flex items-center gap-1">
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="上一页"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="tabular-nums">
          {page} / {pages}
        </span>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="下一页"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
