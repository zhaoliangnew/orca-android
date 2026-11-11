import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { getWorktreeVisitTimestamp } from '@/lib/workspace/activation/worktree-visit-recency'
import type { ProjectGroup } from '../../../../shared/project-group-types'
import type { Worktree } from '../../../../shared/worktree/types'
import { productAlias, productFolderName } from './product-aliases'

export type OverviewCheckout = {
  worktree: Worktree
  isMain: boolean
  label: string
  visitedAt?: number
  active: boolean
}

export type OverviewProduct = {
  /** Path relative to the group folder; unique even when customers share product folder names. */
  name: string
  /** Repo folder name (app_bind); aliases are keyed by it. */
  folder: string
  /** Customer folder between the group and the repo, e.g. "2.0-东阿中学"; empty when direct. */
  scope: string
  alias?: string
  checkouts: OverviewCheckout[]
  visitedAt?: number
}

function checkoutLabel(worktree: Worktree): string {
  const branch = worktree.branch?.replace(/^refs\/heads\//, '')
  return branch || `(detached @ ${worktree.head.slice(0, 7)})`
}

function relativeProductPath(groupPath: string | null, repoPath: string): string | null {
  const root = groupPath?.replace(/[\\/]+$/, '')
  return root && repoPath.startsWith(`${root}/`) ? repoPath.slice(root.length + 1) : null
}

function groupAndDescendantIds(groups: readonly ProjectGroup[], rootId: string): Set<string> {
  const ids = new Set([rootId])
  let grew = true
  while (grew) {
    grew = false
    for (const group of groups) {
      if (group.parentGroupId && ids.has(group.parentGroupId) && !ids.has(group.id)) {
        ids.add(group.id)
        grew = true
      }
    }
  }
  return ids
}

/** leniu: every repo under a folder-backed project group with its main checkout and worktrees. */
export function useProjectOverviewProducts(group: ProjectGroup): OverviewProduct[] {
  const repos = useAppStore((s) => s.repos)
  const projectGroups = useAppStore((s) => s.projectGroups)
  const worktreesByRepo = useAppStore((s) => s.worktreesByRepo)
  const lastVisited = useAppStore((s) => s.lastVisitedAtByWorktreeId)
  const activeWorktreeId = useAppStore((s) => s.activeWorktreeId)
  const aliases = useAppStore((s) => s.settings?.productAliases)

  return useMemo(() => {
    const groupIds = groupAndDescendantIds(projectGroups, group.id)
    return repos
      .filter((repo) => repo.projectGroupId && groupIds.has(repo.projectGroupId))
      .map((repo) => {
        const folder = productFolderName(repo.path)
        const name = relativeProductPath(group.parentPath, repo.path) ?? folder
        const scope = name.includes('/') ? name.slice(0, name.lastIndexOf('/')) : ''
        const checkouts = (worktreesByRepo[repo.id] ?? [])
          .filter((worktree) => !worktree.isBare)
          .map((worktree) => ({
            worktree,
            isMain: worktree.isMainWorktree,
            label: checkoutLabel(worktree),
            visitedAt: getWorktreeVisitTimestamp(lastVisited, worktree),
            active: worktree.id === activeWorktreeId
          }))
          .sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.label.localeCompare(b.label))
        const visits = checkouts.map((checkout) => checkout.visitedAt ?? 0)
        return {
          name,
          folder,
          scope,
          alias: productAlias(folder, aliases),
          checkouts,
          visitedAt: Math.max(0, ...visits) || undefined
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [
    activeWorktreeId,
    aliases,
    group.id,
    group.parentPath,
    lastVisited,
    projectGroups,
    repos,
    worktreesByRepo
  ])
}
