export type EmulatorOpeningMode = 'last-used' | 'ask' | 'specific'
export type EmulatorDevicePreference = {
  backend: 'ios' | 'android'
  kind: 'avd' | 'device'
  id: string
  name: string
  lastUsedAt: string
}
export type EmulatorSelectionRequired = 'first-use' | 'ask' | 'missing' | 'unavailable'

export function getEmulatorOpeningMode(settings: {
  mobileEmulatorOpeningMode?: EmulatorOpeningMode
  mobileEmulatorDefaultDeviceUdid?: string | null
}): EmulatorOpeningMode {
  return (
    settings.mobileEmulatorOpeningMode ??
    (settings.mobileEmulatorDefaultDeviceUdid ? 'specific' : 'last-used')
  )
}

/** leniu: an Android board seen before, so it stays listed (and reconnectable by IP) while offline. */
export type KnownAndroidDevice = {
  sn: string
  /** Last adb serial, e.g. 192.168.9.184:5555. */
  serial: string
  vendor?: string
  model?: string
  androidVersion?: string
  apiLevel?: string
  key?: string
  lastSeen: number
}

export type EmulatorOpeningSettings = {
  mobileEmulatorOpeningMode?: EmulatorOpeningMode
  mobileEmulatorRecentDevices?: EmulatorDevicePreference[]
  /** leniu: device nicknames keyed by Android serial number (ro.serialno), else the adb serial. */
  mobileEmulatorDeviceRemarks?: Record<string, string>
  /** leniu: category chips for the device table; unset means derived from remarks. */
  mobileEmulatorDeviceKeywords?: string[]
  /** leniu: Android boards seen before, keyed by serial number. */
  mobileEmulatorKnownDevices?: Record<string, KnownAndroidDevice>
}
