import type { ProjectOverviewColumn } from '../../../../shared/leniu-workspace-settings'

/** Until the user drags cards, products are balanced into 1–3 columns by card height. */
export function autoOverviewColumns(
  products: readonly { name: string; rows: number }[]
): ProjectOverviewColumn[] {
  const count = products.length <= 6 ? 1 : products.length <= 14 ? 2 : 3
  const columns = Array.from({ length: count }, () => ({ title: '', names: [] as string[] }))
  const heights = Array.from({ length: count }, () => 0)
  for (const product of products) {
    const shortest = heights.indexOf(Math.min(...heights))
    columns[shortest].names.push(product.name)
    heights[shortest] += 2.4 + product.rows
  }
  return columns
}

/** Saved columns minus vanished products; newly found products join the last column. */
export function resolveOverviewColumns(
  names: readonly string[],
  saved: readonly ProjectOverviewColumn[] | undefined,
  auto: readonly ProjectOverviewColumn[]
): ProjectOverviewColumn[] {
  if (!saved?.length) {
    return auto.map((column) => ({ title: column.title, names: [...column.names] }))
  }
  const known = new Set(names)
  const columns = saved.map((column) => ({
    title: column.title,
    names: column.names.filter((name) => known.has(name))
  }))
  const placed = new Set(columns.flatMap((column) => column.names))
  columns.at(-1)?.names.push(...names.filter((name) => !placed.has(name)))
  return columns
}

/** Moves a card into `column`, before/after `target` when dropped on another card. */
export function moveOverviewCard(
  columns: readonly ProjectOverviewColumn[],
  name: string,
  column: number,
  target: string | null,
  after: boolean
): ProjectOverviewColumn[] {
  const next = columns.map((item) => ({
    title: item.title,
    names: item.names.filter((itemName) => itemName !== name)
  }))
  const destination = next[column]
  if (!destination) {
    return columns.map((item) => ({ title: item.title, names: [...item.names] }))
  }
  const at = target ? destination.names.indexOf(target) : -1
  if (at < 0) {
    destination.names.push(name)
  } else {
    destination.names.splice(after ? at + 1 : at, 0, name)
  }
  return next
}

export function moveOverviewColumn(
  columns: readonly ProjectOverviewColumn[],
  from: number,
  to: number,
  after: boolean
): ProjectOverviewColumn[] {
  const next = [...columns]
  if (!next[from] || !next[to] || from === to) {
    return next
  }
  const [moved] = next.splice(from, 1)
  const at = next.indexOf(columns[to])
  next.splice(after ? at + 1 : at, 0, moved)
  return next
}

/** 刚刚 / N 分钟前 / N 小时前 / 昨天 HH:MM / M-D HH:MM, matching the device-side history wording. */
export function formatOverviewVisit(at: number | undefined, now = Date.now()): string {
  if (!at) {
    return ''
  }
  const minutes = Math.floor((now - at) / 60_000)
  if (minutes < 1) {
    return '刚刚'
  }
  if (minutes < 60) {
    return `${minutes} 分钟前`
  }
  const date = new Date(at)
  const today = new Date(now)
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  if (date.toDateString() === today.toDateString()) {
    return `${Math.floor(minutes / 60)} 小时前`
  }
  const yesterday = new Date(now - 86_400_000)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${time}`
  }
  return `${date.getMonth() + 1}-${date.getDate()} ${time}`
}
