import type { EmulatorSessionInfo } from '../emulator-types'
import type { AndroidSdkPaths } from './android-sdk-discovery'
import type { AndroidCommandRunner } from './android-command-runner'
import {
  androidStreamKey,
  androidStreamSessionInfo,
  type AndroidStreamHandle,
  type StartAndroidStream
} from './android-stream-session-starter'
import { scrcpyVideoRegistry } from '../scrcpy-video-registry'

export type AndroidStreamControllerDeps = {
  runner: AndroidCommandRunner
  sdk: () => AndroidSdkPaths
  ensureJar: () => Promise<string>
  startStreamSession: StartAndroidStream
  maxSize: number
}

// Deduplicate starts so racing attaches cannot launch competing scrcpy servers.
export class AndroidStreamController {
  private readonly handles = new Map<string, AndroidStreamHandle>()
  private readonly starts = new Map<string, Promise<EmulatorSessionInfo>>()

  constructor(private readonly deps: AndroidStreamControllerDeps) {}

  async start(serial: string, displayId?: number): Promise<EmulatorSessionInfo> {
    const key = androidStreamKey(serial, displayId)
    const inFlight = this.starts.get(key)
    if (inFlight) {
      return inFlight
    }
    const start = this.begin(serial, displayId)
    this.starts.set(key, start)
    try {
      return await start
    } finally {
      this.starts.delete(key)
    }
  }

  private async begin(serial: string, displayId?: number): Promise<EmulatorSessionInfo> {
    const key = androidStreamKey(serial, displayId)
    if (this.handles.has(key) && scrcpyVideoRegistry.has(key)) {
      return androidStreamSessionInfo(key)
    }
    this.handles.delete(key)
    const jarPath = await this.deps.ensureJar()
    const { info, handle } = await this.deps.startStreamSession({
      runner: this.deps.runner,
      sdk: this.deps.sdk(),
      serial,
      jarPath,
      maxSize: this.deps.maxSize,
      displayId
    })
    this.handles.set(key, handle)
    return info
  }

  stopDisplay(serial: string, displayId: number): void {
    this.close(androidStreamKey(serial, displayId))
  }

  // Secondary displays share the device session, so they stop with the primary stream.
  stop(serial: string): void {
    for (const key of this.handles.keys()) {
      if (key.startsWith(`${serial}#d`)) {
        this.close(key)
      }
    }
    this.close(serial)
  }

  private close(key: string): void {
    const handle = this.handles.get(key)
    if (handle) {
      handle.close()
      this.handles.delete(key)
    }
  }
}
