import type { SimulatorDeviceRow } from './emulator-pane-types'

// leniu: remarks follow the board's serial number so a DHCP address change keeps the nickname.
export function emulatorDeviceRemarkKey(device: SimulatorDeviceRow): string {
  return device.serialNo || device.udid
}

export function emulatorDeviceRemark(
  device: SimulatorDeviceRow,
  remarks: Record<string, string> | undefined
): string | undefined {
  return remarks?.[emulatorDeviceRemarkKey(device)]?.trim() || undefined
}

/** `192.168.9.184:5555` → `9.184`; USB serials and emulators have no network address. */
export function emulatorDeviceShortIp(udid: string): string | undefined {
  return /^\d+\.\d+\.(\d+\.\d+):\d+$/.exec(udid)?.[1]
}

export function withEmulatorDeviceRemark(
  remarks: Record<string, string> | undefined,
  device: SimulatorDeviceRow,
  remark: string
): Record<string, string> {
  const next = { ...remarks }
  const key = emulatorDeviceRemarkKey(device)
  if (remark.trim()) {
    next[key] = remark.trim()
  } else {
    delete next[key]
  }
  return next
}
