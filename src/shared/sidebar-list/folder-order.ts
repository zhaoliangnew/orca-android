import type { ProjectGroup } from '../project-group-types'

/** leniu: the folder name a project or group lives in, used by the "folder" project order. */
export function folderOrderName(path: string | null | undefined, fallback = ''): string {
  return (
    path
      ?.replace(/[\\/]+$/, '')
      .split(/[\\/]/)
      .at(-1) || fallback
  )
}

export function projectGroupFolderOrderName(group: ProjectGroup): string {
  return folderOrderName(group.parentPath, group.name)
}

/** Code-point order, the same order `ls` and the Finder name column give these folder names. */
export function compareFolderOrderNames(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
