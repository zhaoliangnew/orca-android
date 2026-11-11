import { useSyncExternalStore } from 'react'

// leniu: whether the Tasks page shows 云效 instead of the GitHub/Linear/Jira sources.
let open = false
const listeners = new Set<() => void>()

export function setMobileYunxiaoOpen(next: boolean): void {
  if (next !== open) {
    open = next
    listeners.forEach((listener) => listener())
  }
}

export function useMobileYunxiaoOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => open
  )
}
