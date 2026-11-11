import { useEffect } from 'react'
import { openAppHttpLink } from '@/lib/browser/navigation/app-http-link-open'
import { useYunxiaoPage } from './yunxiao-page-store'

let linksRequested = false

/** leniu: the Yunxiao work item a workspace was linked to, as a small serial tag on its card. */
export function YunxiaoWorkspaceBadge({ worktreeId }: { worktreeId: string }) {
  const link = useYunxiaoPage((s) => s.links.find((entry) => entry.worktreeId === worktreeId))
  useEffect(() => {
    // Every card reads one shared list; load it once per window.
    if (!linksRequested) {
      linksRequested = true
      void useYunxiaoPage.getState().refreshLinks()
    }
  }, [])
  if (!link) {
    return null
  }
  return (
    <button
      type="button"
      title={`${link.serialNumber} ${link.subject}`}
      className="shrink-0 rounded bg-blue-500/15 px-1 font-mono text-[10px] leading-4 text-blue-500 hover:bg-blue-500/25"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        openAppHttpLink(link.url, { event })
      }}
    >
      {link.serialNumber}
    </button>
  )
}
