import type { AppState } from '@/store/types'
import { findWorktreeById } from '@/store/github/refresh/worktree-refresh'
import { getWorktreeIdFromVisitKey } from '@/lib/workspace/activation/worktree-visit-recency'
import type { Worktree } from '../../../../../../shared/worktree/types'
import { productAlias, productFolderName } from '../../../project-overview/product-aliases'

export type RecentSwitchRow = {
  worktree: Worktree
  visitedAt?: number
  /** Folder that holds the repo, e.g. "workspace_5.0-标准版" or a customer folder. */
  group: string
  product: string
  alias?: string
  isMain: boolean
  branch: string
  current: boolean
}

function parentFolderName(path: string): string {
  return (
    path
      .replace(/[\\/]+$/, '')
      .split(/[\\/]/)
      .at(-2) ?? ''
  )
}

function toRow(
  state: AppState,
  worktree: Worktree,
  visitedAt: number | undefined,
  current: boolean
): RecentSwitchRow {
  const repo = state.repos.find((item) => item.id === worktree.repoId)
  const rootPath = repo?.path ?? worktree.path
  const product = productFolderName(rootPath)
  return {
    worktree,
    visitedAt,
    group: parentFolderName(rootPath),
    product,
    alias: productAlias(product, state.settings?.productAliases),
    isMain: worktree.isMainWorktree,
    branch: worktree.branch?.replace(/^refs\/heads\//, '') || worktree.displayName,
    current
  }
}

/** leniu: the active workspace, plus up to `count` most recently switched-to others across projects. */
export function buildRecentSwitchRows(
  state: AppState,
  count: number
): { current: RecentSwitchRow | null; recent: RecentSwitchRow[] } {
  const latestById = new Map<string, number>()
  for (const [key, at] of Object.entries(state.lastVisitedAtByWorktreeId)) {
    const id = getWorktreeIdFromVisitKey(key)
    latestById.set(id, Math.max(at, latestById.get(id) ?? 0))
  }
  const active = state.activeWorktreeId ? findWorktreeById(state, state.activeWorktreeId) : null
  const hiddenAt = state.settings?.recentSwitchHiddenAt ?? {}
  const clearedAt = state.settings?.recentSwitchClearedAt ?? 0
  const recent: RecentSwitchRow[] = []
  for (const [id, at] of [...latestById].sort((a, b) => b[1] - a[1])) {
    if (recent.length >= count) {
      break
    }
    // Removed or cleared entries return once visited again.
    if (at <= Math.max(clearedAt, hiddenAt[id] ?? 0)) {
      continue
    }
    const worktree = id === active?.id ? null : findWorktreeById(state, id)
    if (worktree) {
      recent.push(toRow(state, worktree, at, false))
    }
  }
  return {
    current: active ? toRow(state, active, latestById.get(active.id), true) : null,
    recent
  }
}
