import { Home, Power, RotateCw, Smartphone } from 'lucide-react'
import { EmulatorDevicePicker } from './emulator-device-picker'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SimulatorDeviceRow } from './emulator-pane-types'
import { useTranslate } from '@/i18n/use-translate'
import { useAppStore } from '@/store'
import { emulatorDeviceRemark, emulatorDeviceShortIp } from './emulator-device-remark'

type EmulatorPaneToolbarProps = {
  displayName: string
  isLive: boolean
  loading: boolean
  devices: SimulatorDeviceRow[]
  selectedUdid: string | null
  onSelectDevice: (udid: string) => void
  onConnectAddress: (address: string) => Promise<void>
  onAttach: () => void
  onShutdown: () => void
  onHome: () => void
  onRotate: () => void
}

export function EmulatorPaneToolbar({
  displayName,
  isLive,
  loading,
  devices,
  selectedUdid,
  onSelectDevice,
  onConnectAddress,
  onAttach,
  onShutdown,
  onHome,
  onRotate
}: EmulatorPaneToolbarProps) {
  const t = useTranslate()
  const remarks = useAppStore((s) => s.settings?.mobileEmulatorDeviceRemarks)
  const selected = devices.find((device) => device.udid === selectedUdid)
  const selectedRemark = selected ? emulatorDeviceRemark(selected, remarks) : undefined
  // leniu: name the board by IP and remark (e.g. "10.136 · 餐台") instead of its model.
  const title = selectedRemark
    ? [emulatorDeviceShortIp(selected!.udid), selectedRemark].filter(Boolean).join(' · ')
    : displayName
  // Show preview/control connection state rather than CoreSimulator boot state.
  const statusLabel = isLive ? 'Connected' : loading ? 'Working…' : 'Not connected'
  const subtleStatus = isLive || loading
  const statusClassName = subtleStatus
    ? 'text-muted-foreground'
    : 'border-border bg-muted text-muted-foreground'

  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
      <Smartphone className="size-4 shrink-0 text-primary" />
      <span className="truncate font-medium">{title}</span>
      <span
        className={cn(
          'shrink-0 text-[11px]',
          !subtleStatus && 'rounded border px-1.5 py-0.5 text-[10px]',
          statusClassName
        )}
      >
        {statusLabel}
      </span>
      <div className="flex-1" />
      <EmulatorDevicePicker
        devices={devices}
        selectedUdid={selectedUdid}
        onSelectDevice={onSelectDevice}
        onConnectAddress={onConnectAddress}
        disabled={loading}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={onRotate}
            disabled={!isLive || loading}
            aria-label={t(
              'auto.components.emulator.pane.emulator.pane.toolbar.6bd8dff42a',
              'Rotate'
            )}
          >
            <RotateCw className="size-3.5" />
            <span className="hidden sm:inline">
              {t('auto.components.emulator.pane.emulator.pane.toolbar.6bd8dff42a', 'Rotate')}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          {t('auto.components.emulator.pane.emulator.pane.toolbar.6bd8dff42a', 'Rotate')}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="icon-xs"
            className="size-7"
            onClick={onHome}
            disabled={!isLive || loading}
            aria-label={t('auto.components.emulator.pane.emulator.pane.toolbar.e7a0d1897e', 'Home')}
          >
            <Home className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          {t('auto.components.emulator.pane.emulator.pane.toolbar.e7a0d1897e', 'Home')}
        </TooltipContent>
      </Tooltip>
      {isLive ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={onShutdown}
              disabled={loading}
              aria-label={t(
                'auto.components.emulator.pane.emulator.pane.toolbar.06e10d7356',
                'Shut down emulator'
              )}
            >
              <Power className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={4}>
            {t(
              'auto.components.emulator.pane.emulator.pane.toolbar.06e10d7356',
              'Shut down emulator'
            )}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          type="button"
          size="sm"
          variant={loading ? 'ghost' : 'default'}
          className={cn('h-7 px-2 text-xs', loading && 'text-muted-foreground')}
          onClick={onAttach}
          disabled={
            loading ||
            devices.length === 0 ||
            devices.find((device) => device.udid === selectedUdid)?.isAvailable === false
          }
        >
          {loading
            ? t('auto.components.emulator.pane.emulator.pane.toolbar.868c0f2938', 'Working…')
            : t('auto.components.emulator.pane.emulator.pane.toolbar.81b3571a07', 'Connect')}
        </Button>
      )}
    </div>
  )
}
