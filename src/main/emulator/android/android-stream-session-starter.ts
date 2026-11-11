import type { EmulatorSessionInfo } from '../emulator-types'
import { scrcpyVideoRegistry } from '../scrcpy-video-registry'
import type { AndroidCommandRunner } from './android-command-runner'
import type { AndroidSdkPaths } from './android-sdk-discovery'
import { ScrcpyStreamSession } from './scrcpy-stream-session'

export type AndroidStreamHandle = { close: () => void }

export type StartAndroidStreamParams = {
  runner: AndroidCommandRunner
  sdk: AndroidSdkPaths
  serial: string
  jarPath: string
  maxSize?: number
  displayId?: number
}

export type StartAndroidStream = (
  params: StartAndroidStreamParams
) => Promise<{ info: EmulatorSessionInfo; handle: AndroidStreamHandle }>

/** leniu: secondary displays get their own registry key so video and touch IPC route per display. */
export function androidStreamKey(serial: string, displayId?: number): string {
  return displayId ? `${serial}#d${displayId}` : serial
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength)
  new Uint8Array(arrayBuffer).set(buffer)
  return arrayBuffer
}

export const startAndroidStreamSession: StartAndroidStream = async ({
  runner,
  sdk,
  serial,
  jarPath,
  maxSize,
  displayId
}) => {
  const key = androidStreamKey(serial, displayId)
  // A second server must not overwrite the jar the primary server has open.
  const deviceJarPath = displayId ? `/data/local/tmp/scrcpy-server-d${displayId}.jar` : undefined
  let session: ScrcpyStreamSession | null = null
  // Register before startup so early config/keyframes enter the replay cache.
  scrcpyVideoRegistry.register(key, () => session?.close())
  try {
    session = await ScrcpyStreamSession.start(
      { runner, sdk, serial, localJarPath: jarPath, maxSize, displayId, deviceJarPath },
      {
        onMeta: (meta) => scrcpyVideoRegistry.pushMeta(key, meta),
        onFrame: (frame) =>
          scrcpyVideoRegistry.pushFrame(key, {
            config: frame.config,
            keyFrame: frame.keyFrame,
            pts: frame.pts.toString(),
            bytes: toArrayBuffer(frame.data)
          }),
        onError: () => scrcpyVideoRegistry.stop(key),
        onClose: () => scrcpyVideoRegistry.stop(key)
      }
    )
  } catch (error) {
    scrcpyVideoRegistry.stop(key)
    throw error
  }
  scrcpyVideoRegistry.attachControl(key, session)

  let closed = false
  return {
    info: androidStreamSessionInfo(key),
    handle: {
      close: () => {
        if (closed) {
          return
        }
        closed = true
        session?.close()
        scrcpyVideoRegistry.stop(key)
      }
    }
  }
}

export function androidStreamSessionInfo(serial: string): EmulatorSessionInfo {
  return {
    deviceUdid: serial,
    streamUrl: `scrcpy://${serial}`,
    wsUrl: '',
    streamCodec: 'h264',
    backend: 'android'
  }
}
