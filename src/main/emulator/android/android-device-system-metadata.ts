import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import type { AndroidSdkPaths } from './android-sdk-discovery'
import type { AndroidCommandRunner } from './android-command-runner'
import type { EmulatorDevice } from '../backends/emulator-backend'

// leniu: boards keep their activation key here; one shell call reads it alongside getprop.
const DEVICE_KEY_MARKER = '__ORCA_DEVICE_KEY__'
const DEVICE_SHELL_SCRIPT = `getprop; echo ${DEVICE_KEY_MARKER}; cat /sdcard/key/key.txt 2>/dev/null`

function readProp(props: string, name: string): string | undefined {
  const escaped = name.replace(/\./g, '\\.')
  return new RegExp(`\\[${escaped}\\]: \\[([^\\]]+)\\]`).exec(props)?.[1]
}

export async function readAndroidDeviceSystemMetadata(
  device: EmulatorDevice,
  runner: AndroidCommandRunner,
  sdk: AndroidSdkPaths
): Promise<Pick<EmulatorDevice, 'osVersion' | 'apiLevel' | 'serialNo' | 'vendor' | 'deviceKey'>> {
  if (device.state === 'booted') {
    const result = await runner(sdk.adb, ['-s', device.id, 'shell', DEVICE_SHELL_SCRIPT], {
      timeoutMs: 5000
    })
    if (result.code !== 0 && !result.stdout.includes(DEVICE_KEY_MARKER)) {
      return {}
    }
    const [props = '', keyFile = ''] = result.stdout.split(DEVICE_KEY_MARKER)
    return {
      osVersion: readProp(props, 'ro.build.version.release'),
      apiLevel: readProp(props, 'ro.build.version.sdk'),
      serialNo: readProp(props, 'ro.serialno'),
      vendor: readProp(props, 'ro.product.manufacturer'),
      deviceKey: keyFile.trim().split(/\r?\n/)[0]?.trim() || undefined
    }
  }
  if (device.detail !== 'avd' || /[\\/]/.test(device.id)) {
    return {}
  }
  const androidHome =
    process.env.ANDROID_USER_HOME ||
    process.env.ANDROID_EMULATOR_HOME ||
    join(homedir(), '.android')
  const avdHome = process.env.ANDROID_AVD_HOME || join(androidHome, 'avd')
  const ini = await readFile(join(avdHome, `${device.id}.ini`), 'utf8').catch(() => '')
  const configuredPath = ini.match(/^path=(.+)$/m)?.[1]?.trim()
  const avdPath =
    configuredPath && isAbsolute(configuredPath)
      ? configuredPath
      : join(avdHome, `${device.id}.avd`)
  const config = await readFile(join(avdPath, 'config.ini'), 'utf8').catch(() => '')
  const image = config.match(/^image\.sysdir\.1\s*=\s*(.+)$/m)?.[1]?.trim()
  const apiLevel = image?.match(/(?:^|[/\\])android-([^/\\]+)[/\\]/)?.[1]
  if (!image) {
    return {}
  }
  return { apiLevel }
}
