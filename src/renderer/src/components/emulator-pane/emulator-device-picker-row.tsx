import { useEffect, useState } from 'react'
import { Check, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommandItem } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { useTranslate } from '@/i18n/use-translate'
import { cn } from '@/lib/utils'
import type { SimulatorDeviceRow } from './emulator-pane-types'
import { emulatorDeviceDescription } from './emulator-device-picker-groups'
import { emulatorDeviceShortIp } from './emulator-device-remark'

// leniu: one device per line — IP | remark + vendor · model | OS | SN | key | status | actions.
export const EMULATOR_DEVICE_ROW_GRID =
  'grid grid-cols-[60px_minmax(0,1fr)_140px_150px_64px_48px_44px] items-center gap-2'

// The popover covers app toasts, so the copied confirmation shows in the cell itself.
function CopyCell({ value }: { value?: string }) {
  const t = useTranslate()
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) {
      return
    }
    const timer = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(timer)
  }, [copied])
  if (!value) {
    return <span className="text-muted-foreground">-</span>
  }
  return (
    <button
      type="button"
      title={t('emulator.picker.copy', 'Click to copy')}
      className={cn(
        'truncate text-left font-mono text-xs hover:text-primary hover:underline',
        copied && 'text-emerald-500'
      )}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        void window.api.ui.writeClipboardText(value)
        setCopied(true)
      }}
    >
      {copied ? t('emulator.picker.copiedShort', 'Copied') : value}
    </button>
  )
}

type RowProps = {
  device: SimulatorDeviceRow
  remark?: string
  selected: boolean
  onSelect: () => void
  onEditRemark: () => void
}

export function EmulatorDevicePickerRow({
  device,
  remark,
  selected,
  onSelect,
  onEditRemark
}: RowProps) {
  const t = useTranslate()
  const status = device.offline
    ? t('emulator.picker.offline', 'Offline')
    : device.state === 'Booted'
      ? t('emulator.picker.running', 'Running')
      : device.state === 'Booting'
        ? t('emulator.picker.starting', 'Starting')
        : t('emulator.picker.stopped', 'Stopped')
  const hardware = [device.vendor, device.name].filter(Boolean).join(' · ')
  const system = emulatorDeviceDescription(device)
  return (
    <CommandItem
      value={device.udid}
      keywords={[
        device.name,
        remark ?? '',
        hardware,
        system,
        device.udid,
        device.serialNo ?? '',
        device.deviceKey ?? '',
        device.availabilityError ?? ''
      ]}
      disabled={device.isAvailable === false}
      selection="palette"
      data-current={selected || undefined}
      className={cn('group', EMULATOR_DEVICE_ROW_GRID)}
      title={device.isAvailable === false ? device.availabilityError : undefined}
      onSelect={onSelect}
    >
      <span className="font-mono text-xs font-medium text-primary">
        {emulatorDeviceShortIp(device.connectAddress ?? device.udid) ?? '-'}
      </span>
      <span className="flex min-w-0 items-baseline gap-2">
        {remark && <span className="truncate">{remark}</span>}
        <span className={cn('truncate', remark && 'shrink-0 text-xs text-muted-foreground')}>
          {hardware}
        </span>
      </span>
      <span className="truncate text-xs text-muted-foreground">{system}</span>
      <CopyCell value={device.serialNo} />
      <CopyCell value={device.deviceKey} />
      <span
        className={cn(
          'text-xs',
          device.state === 'Booted' ? 'text-emerald-500' : 'text-muted-foreground'
        )}
      >
        {status}
      </span>
      <span className="flex items-center justify-end gap-0.5">
        {device.backend === 'android' && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t('emulator.picker.editRemark', 'Edit remark')}
            className="opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              onEditRemark()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.stopPropagation()
              }
            }}
          >
            <Pencil />
          </Button>
        )}
        {selected && <Check className="size-4" />}
      </span>
    </CommandItem>
  )
}

type EditorProps = {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

export function EmulatorDeviceRemarkEditor({ value, onChange, onSave, onCancel }: EditorProps) {
  const t = useTranslate()
  return (
    <div className="px-2 py-1">
      <Input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Enter') {
            onSave()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            onCancel()
          }
        }}
        onBlur={onSave}
        placeholder={t('emulator.picker.remarkPlaceholder', 'Remark, press Enter to save')}
        aria-label={t('emulator.picker.editRemark', 'Edit remark')}
        className="h-7 text-xs"
      />
    </div>
  )
}
