import type { SimulatorDeviceRow } from './emulator-pane-types'
import { emulatorDeviceRemark } from './emulator-device-remark'

/** A remark's category is its head before the first separator: "出入库-王丽" → "出入库". */
function remarkCategory(remark: string): string | null {
  return (
    remark
      .trim()
      .split(/[-\s·_]/)[0]
      ?.trim() || null
  )
}

/** Until the user curates keywords, categories shared by two or more remarks seed the chips. */
export function defaultEmulatorDeviceKeywords(remarks: Record<string, string> | undefined) {
  const counts = new Map<string, number>()
  for (const remark of Object.values(remarks ?? {})) {
    const category = remarkCategory(remark)
    if (category) {
      counts.set(category, (counts.get(category) ?? 0) + 1)
    }
  }
  return [...counts]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category)
}

export function emulatorDeviceMatchesKeyword(
  device: SimulatorDeviceRow,
  remarks: Record<string, string> | undefined,
  keyword: string
): boolean {
  return [emulatorDeviceRemark(device, remarks) ?? '', device.vendor ?? '', device.name]
    .join(' ')
    .toLowerCase()
    .includes(keyword.toLowerCase())
}
