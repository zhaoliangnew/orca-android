import type { KnownAndroidDevice } from '../../../../shared/emulator-opening-preferences'
import type { SimulatorDeviceRow } from './emulator-pane-types'

type KnownDevices = Readonly<Record<string, KnownAndroidDevice>> | undefined

/** leniu: remembered boards adb does not list now are shown offline, newest first. */
export function withKnownOfflineDevices(
  devices: readonly SimulatorDeviceRow[],
  known: KnownDevices
): SimulatorDeviceRow[] {
  const present = new Set(devices.flatMap((device) => [device.serialNo, device.udid]))
  const offline = Object.values(known ?? {})
    .filter((device) => !present.has(device.sn) && !present.has(device.serial))
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .map((device): SimulatorDeviceRow => ({
      name: device.model || device.serial,
      backend: 'android',
      // Several boards may have used the same IP over time, so the SN keeps rows distinct.
      udid: `known:${device.sn}`,
      connectAddress: device.serial,
      state: 'Shutdown',
      runtime: 'device',
      isAvailable: true,
      lastUsedAt: new Date(device.lastSeen).toISOString(),
      osVersion: device.androidVersion,
      apiLevel: device.apiLevel,
      serialNo: device.sn,
      vendor: device.vendor,
      deviceKey: device.key,
      offline: true
    }))
  return [...devices, ...offline]
}

/** Records running boards; returns null when nothing changed so settings are not rewritten. */
export function updatedKnownDevices(
  devices: readonly SimulatorDeviceRow[],
  known: KnownDevices,
  now = Date.now()
): Record<string, KnownAndroidDevice> | null {
  let next: Record<string, KnownAndroidDevice> | null = null
  for (const device of devices) {
    if (device.backend !== 'android' || device.state !== 'Booted' || !device.serialNo) {
      continue
    }
    const previous = known?.[device.serialNo]
    const entry: KnownAndroidDevice = {
      sn: device.serialNo,
      serial: device.udid,
      vendor: device.vendor ?? previous?.vendor,
      model: device.name,
      androidVersion: device.osVersion ?? previous?.androidVersion,
      apiLevel: device.apiLevel ?? previous?.apiLevel,
      key: device.deviceKey ?? previous?.key,
      lastSeen: previous?.lastSeen ?? now
    }
    const changed =
      !previous ||
      (['serial', 'vendor', 'model', 'androidVersion', 'apiLevel', 'key'] as const).some(
        (field) => previous[field] !== entry[field]
      )
    if (changed) {
      next = { ...(next ?? known), [device.serialNo]: { ...entry, lastSeen: now } }
    }
  }
  return next
}
