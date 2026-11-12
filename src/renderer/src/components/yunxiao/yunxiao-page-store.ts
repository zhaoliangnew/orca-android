import { create } from 'zustand'
import type {
  YunxiaoConnectionStatus,
  YunxiaoWorkItem,
  YunxiaoWorkspaceLink
} from '../../../../shared/yunxiao/yunxiao-types'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'

// Older than this, reopening the page refreshes in the background.
const STALE_MS = 2 * 60_000
// New customer projects join the watched list on a daily background scan.
const RESCAN_MS = 24 * 60 * 60_000
const CACHE_KEY = 'leniu.yunxiao.items'

type ItemsCache = { items: YunxiaoWorkItem[]; loadedAt: number }

// The last list survives restarts, so the page shows it at once while it refreshes.
function readCache(): ItemsCache {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '') as ItemsCache
    return Array.isArray(parsed.items) ? parsed : { items: [], loadedAt: 0 }
  } catch {
    return { items: [], loadedAt: 0 }
  }
}

function writeCache(cache: ItemsCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Storage full: the in-memory list still works.
  }
}

/**
 * leniu: whether the tasks page shows Yunxiao, plus the connection, workspace links and every work
 * item assigned to the user. Yunxiao searches one project per request, so the page loads all of
 * them once and filters locally.
 */
type YunxiaoPageState = {
  open: boolean
  status: YunxiaoConnectionStatus | null
  links: YunxiaoWorkspaceLink[]
  items: YunxiaoWorkItem[]
  loadedAt: number
  loading: boolean
  setOpen: (open: boolean) => void
  refreshStatus: () => Promise<void>
  refreshLinks: () => Promise<void>
  /** Reloads from Yunxiao; `ifStale` skips a recent list. */
  loadItems: (options?: { ifStale?: boolean }) => Promise<void>
  /** Swaps in an item just changed (status, dates) without reloading every project. */
  patchItem: (item: YunxiaoWorkItem) => void
  /** Re-finds the watched projects once a day, then reloads the list. */
  rescanIfDue: () => Promise<void>
}

let loadRequest = 0
let rescanning = false
const initialCache = readCache()

export const useYunxiaoPage = create<YunxiaoPageState>((set, get) => ({
  open: false,
  status: null,
  links: [],
  items: initialCache.items,
  loadedAt: initialCache.loadedAt,
  loading: false,
  setOpen: (open) => set({ open }),
  refreshStatus: async () => {
    set({ status: await yunxiaoClient.status() })
  },
  refreshLinks: async () => {
    set({ links: await yunxiaoClient.links().catch(() => []) })
  },
  loadItems: async (options = {}) => {
    if (options.ifStale && Date.now() - get().loadedAt < STALE_MS) {
      return
    }
    const request = ++loadRequest
    set({ loading: true })
    try {
      const items = await yunxiaoClient.list({ filter: 'all' })
      if (request === loadRequest) {
        const loadedAt = Date.now()
        set({ items, loadedAt })
        writeCache({ items, loadedAt })
      }
    } finally {
      if (request === loadRequest) {
        set({ loading: false })
      }
    }
  },
  patchItem: (item) => {
    const { items, loadedAt } = get()
    const next = items.map((entry) => (entry.id === item.id ? { ...entry, ...item } : entry))
    set({ items: next })
    writeCache({ items: next, loadedAt })
  },
  rescanIfDue: async () => {
    const status = get().status
    if (rescanning || !status?.connected || Date.now() - status.lastScannedAt < RESCAN_MS) {
      return
    }
    rescanning = true
    try {
      set({ status: await yunxiaoClient.scanProjects() })
      await get().loadItems()
    } finally {
      rescanning = false
    }
  }
}))
