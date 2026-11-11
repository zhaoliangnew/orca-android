import type { EmulatorBridge } from '../../emulator/emulator-bridge'
import type { EmulatorBackend } from '../../emulator/backends/emulator-backend'

// leniu: networked boards (adb connect) and dual-screen secondary displays.
function requireAndroidBackend(bridge: EmulatorBridge): EmulatorBackend {
  const android = bridge.listBackends().find((backend) => backend.kind === 'android')
  if (!android) {
    throw new Error('Android emulator backend is unavailable on this host')
  }
  return android
}

export async function connectAndroidDevice(bridge: EmulatorBridge, address: string) {
  const android = requireAndroidBackend(bridge)
  if (!android.connectNetworkDevice) {
    throw new Error('Android device connection is unavailable on this host')
  }
  return { id: await android.connectNetworkDevice(address) }
}

export async function listAndroidDisplays(bridge: EmulatorBridge, serial: string) {
  return (await requireAndroidBackend(bridge).listSecondaryDisplays?.(serial)) ?? []
}

export async function startAndroidDisplay(bridge: EmulatorBridge, serial: string, id: number) {
  return { streamKey: await requireAndroidBackend(bridge).startDisplayStream?.(serial, id) }
}

export function stopAndroidDisplay(bridge: EmulatorBridge, serial: string, id: number) {
  requireAndroidBackend(bridge).stopDisplayStream?.(serial, id)
  return { ok: true }
}
