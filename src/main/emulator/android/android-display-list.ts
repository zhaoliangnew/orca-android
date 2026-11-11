import type { AndroidCommandRunner } from './android-command-runner'
import type { AndroidSdkPaths } from './android-sdk-discovery'

export type AndroidDisplay = { id: number; name: string; width: number; height: number }

const DISPLAY_INFO =
  /mBaseDisplayInfo=DisplayInfo\{"([^"]*)", displayId (\d+).*?real (\d+) x (\d+).*?type (\w+)/
const WINDOWS_MARKER = '__ORCA_DISPLAY_WINDOWS__'
const DISPLAY_SHELL_SCRIPT = `dumpsys display; echo ${WINDOWS_MARKER}; dumpsys window windows | grep mDisplayId=`

function displayIdsIn(text: string, pattern: RegExp): Set<number> {
  return new Set([...text.matchAll(pattern)].map((match) => Number(match[1])))
}

/**
 * leniu: physical non-default displays in real use. Many single-screen boards still report an idle
 * HDMI panel, so a display counts only when an app window is on it or a touch viewport targets it.
 */
export function parseAndroidSecondaryDisplays(output: string): AndroidDisplay[] {
  const [dumpsys = '', windows = ''] = output.split(WINDOWS_MARKER)
  const viewports = dumpsys.match(/mViewports=\[.*\]/)?.[0] ?? ''
  const inUse = new Set([
    ...displayIdsIn(viewports, /DisplayViewport\{[^}]*?displayId=(\d+)/g),
    ...displayIdsIn(windows, /mDisplayId=(\d+)/g)
  ])
  const displays = new Map<number, AndroidDisplay>()
  for (const line of dumpsys.split('\n')) {
    const match = DISPLAY_INFO.exec(line)
    if (!match || !['INTERNAL', 'EXTERNAL'].includes(match[5])) {
      continue
    }
    const id = Number(match[2])
    if (id !== 0 && inUse.has(id) && !displays.has(id)) {
      displays.set(id, { id, name: match[1], width: Number(match[3]), height: Number(match[4]) })
    }
  }
  return [...displays.values()]
}

export async function listAndroidSecondaryDisplays(
  runner: AndroidCommandRunner,
  sdk: AndroidSdkPaths,
  serial: string
): Promise<AndroidDisplay[]> {
  const result = await runner(sdk.adb, ['-s', serial, 'shell', DISPLAY_SHELL_SCRIPT], {
    timeoutMs: 5000
  })
  return result.stdout.includes(WINDOWS_MARKER) ? parseAndroidSecondaryDisplays(result.stdout) : []
}
