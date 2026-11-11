import { EmulatorError } from '../emulator-errors'
import type { AndroidCommandRunner } from './android-command-runner'
import type { AndroidSdkPaths } from './android-sdk-discovery'

const DEFAULT_ADB_TCP_PORT = 5555

/** Accepts `host` or `host:port`; adb's TCP default port is used when none is given. */
export function normalizeAndroidNetworkAddress(address: string): string {
  const trimmed = address.trim()
  const match = /^([A-Za-z0-9.-]+)(?::(\d{1,5}))?$/.exec(trimmed)
  if (!match) {
    throw new EmulatorError('emulator_error', `Invalid device address: ${trimmed}`)
  }
  return `${match[1]}:${match[2] ?? DEFAULT_ADB_TCP_PORT}`
}

// adb connect exits 0 even on failure, so success is read from its output.
export async function connectAndroidNetworkDevice(
  runner: AndroidCommandRunner,
  sdk: AndroidSdkPaths,
  address: string
): Promise<string> {
  const serial = normalizeAndroidNetworkAddress(address)
  const result = await runner(sdk.adb, ['connect', serial], { timeoutMs: 10_000 })
  const output = `${result.stdout}\n${result.stderr}`.trim()
  if (result.code !== 0 || !/\b(?:already )?connected to\b/i.test(output)) {
    throw new EmulatorError('emulator_error', `adb connect ${serial} failed: ${output}`)
  }
  return serial
}
