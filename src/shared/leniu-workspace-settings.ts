/** leniu: one column of the workspace overview; `names` are product folder names in display order. */
export type ProjectOverviewColumn = { title: string; names: string[] }

/** leniu: a saved prompt sent from the chat composer's 快捷指令 menu; 【…】 marks a blank to fill. */
export type QuickPrompt = {
  id: string
  label: string
  text: string
  /** Sends only on a second click within a few seconds (commit, push, install…). */
  confirm?: boolean
  group?: string
}

export type LeniuWorkspaceSettings = {
  /** Chinese product names keyed by repo folder name (app_bind → 取盘机); empty string hides one. */
  productAliases?: Record<string, string>
  /** Overview columns per project group id, arranged by dragging product cards. */
  projectOverviewLayouts?: Record<string, ProjectOverviewColumn[]>
  /** Rows in the recent-switch list under the chat composer (besides the current workspace). */
  recentSwitchCount?: number
  /** Removed from the recent list at (ms), per worktree id; a later visit brings it back. */
  recentSwitchHiddenAt?: Record<string, number>
  /** 清空最近: visits up to this moment (ms) leave the list. */
  recentSwitchClearedAt?: number
  /** Unset means the built-in defaults; once edited the whole list is stored. */
  quickPrompts?: QuickPrompt[]
}
