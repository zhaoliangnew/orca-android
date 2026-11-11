import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useTranslate } from '@/i18n/use-translate'
import { callRuntimeRpc } from '@/runtime/rpc/calls/runtime-rpc-call'
import { useEmulatorVideoStream } from './use-emulator-video-stream'

type AndroidDisplay = { id: number; name: string; width: number; height: number }
type TouchPhase = 'begin' | 'move' | 'end'

// leniu: dual-screen boards (customer/HDMI panels) show each secondary display above the main one.
export function EmulatorSecondaryDisplays({
  serial,
  enabled
}: {
  serial: string
  enabled: boolean
}) {
  const [displays, setDisplays] = useState<AndroidDisplay[]>([])
  useEffect(() => {
    if (!enabled) {
      return
    }
    let cancelled = false
    callRuntimeRpc({ kind: 'local' }, 'emulator.listAndroidDisplays', { serial })
      .then((list) => {
        if (!cancelled) {
          setDisplays(list as AndroidDisplay[])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDisplays([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [serial, enabled])
  if (!enabled || displays.length === 0) {
    return null
  }
  return (
    <div className="flex min-h-0 flex-1 gap-3 pb-3">
      {displays.map((display) => (
        <EmulatorSecondaryDisplay key={display.id} serial={serial} display={display} />
      ))}
    </div>
  )
}

function EmulatorSecondaryDisplay({
  serial,
  display
}: {
  serial: string
  display: AndroidDisplay
}) {
  const t = useTranslate()
  const [streamKey, setStreamKey] = useState<string | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const pressed = useRef(false)

  useEffect(() => {
    let cancelled = false
    const params = { serial, displayId: display.id }
    callRuntimeRpc({ kind: 'local' }, 'emulator.startAndroidDisplay', params)
      .then((result) => {
        if (!cancelled) {
          setStreamKey((result as { streamKey?: string }).streamKey ?? null)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStartError(error instanceof Error ? error.message : String(error))
        }
      })
    return () => {
      cancelled = true
      void callRuntimeRpc({ kind: 'local' }, 'emulator.stopAndroidDisplay', params).catch(() => {})
    }
  }, [serial, display.id])

  const video = useEmulatorVideoStream(
    streamKey ?? undefined,
    streamKey ?? undefined,
    Boolean(streamKey)
  )

  const sendTouch = (event: PointerEvent<HTMLCanvasElement>, type: TouchPhase): void => {
    if (!streamKey) {
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const clamp = (value: number): number => Math.min(1, Math.max(0, value))
    window.api.emulator.sendScrcpyTouch({
      deviceId: streamKey,
      type,
      x: clamp((event.clientX - rect.left) / rect.width),
      y: clamp((event.clientY - rect.top) / rect.height)
    })
  }

  const error = startError ?? video.error
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">
        {t('emulator.secondaryDisplay', 'Secondary display')} · {display.name}
      </span>
      {error ? (
        <p className="text-xs break-all text-destructive">{error}</p>
      ) : (
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <canvas
            ref={video.canvasRef}
            width={display.width}
            height={display.height}
            className="max-h-full max-w-full touch-none border-4 border-black bg-black"
            onPointerDown={(event) => {
              pressed.current = true
              event.currentTarget.setPointerCapture(event.pointerId)
              sendTouch(event, 'begin')
            }}
            onPointerMove={(event) => {
              if (pressed.current) {
                sendTouch(event, 'move')
              }
            }}
            onPointerUp={(event) => {
              if (pressed.current) {
                pressed.current = false
                sendTouch(event, 'end')
              }
            }}
            onPointerCancel={(event) => {
              if (pressed.current) {
                pressed.current = false
                sendTouch(event, 'end')
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
