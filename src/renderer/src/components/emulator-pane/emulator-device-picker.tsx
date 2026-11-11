import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { useTranslate } from '@/i18n/use-translate'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import type { SimulatorDeviceRow } from './emulator-pane-types'
import { emulatorDeviceDescription, groupEmulatorDevices } from './emulator-device-picker-groups'
import {
  emulatorDeviceRemark,
  emulatorDeviceShortIp,
  withEmulatorDeviceRemark
} from './emulator-device-remark'
import {
  EMULATOR_DEVICE_ROW_GRID,
  EmulatorDevicePickerRow,
  EmulatorDeviceRemarkEditor
} from './emulator-device-picker-row'
import { EmulatorNetworkConnectForm } from './emulator-network-connect-form'
import { EmulatorDeviceKeywordBar } from './emulator-device-keyword-bar'
import {
  defaultEmulatorDeviceKeywords,
  emulatorDeviceMatchesKeyword
} from './emulator-device-keywords'

type Props = {
  devices: SimulatorDeviceRow[]
  selectedUdid: string | null
  disabled?: boolean
  onSelectDevice: (id: string) => void
  onConnectAddress: (address: string) => Promise<void>
}

export function EmulatorDevicePicker({
  devices,
  selectedUdid,
  disabled,
  onSelectDevice,
  onConnectAddress
}: Props) {
  const t = useTranslate()
  const remarks = useAppStore((s) => s.settings?.mobileEmulatorDeviceRemarks)
  const savedKeywords = useAppStore((s) => s.settings?.mobileEmulatorDeviceKeywords)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [keyword, setKeyword] = useState<string | null>(null)
  const [otherOpen, setOtherOpen] = useState(false)
  const [unavailableOpen, setUnavailableOpen] = useState(false)
  const [editingUdid, setEditingUdid] = useState<string | null>(null)
  const [remarkDraft, setRemarkDraft] = useState('')
  const onlineCount = devices.filter((device) => device.state === 'Booted').length
  const keywords = savedKeywords ?? defaultEmulatorDeviceKeywords(remarks)
  const keywordCounts = new Map(
    keywords.map((item) => [
      item,
      devices.filter((device) => emulatorDeviceMatchesKeyword(device, remarks, item)).length
    ])
  )
  const visibleDevices = devices.filter(
    (device) =>
      (!onlineOnly || device.state === 'Booted') &&
      (!keyword || emulatorDeviceMatchesKeyword(device, remarks, keyword))
  )
  const expanded = Boolean(search || keyword || onlineOnly)
  const groups = groupEmulatorDevices(visibleDevices, selectedUdid)
  const selected = devices.find((device) => device.udid === selectedUdid)
  const chooseLabel = t('emulator.picker.choose', 'Choose emulator')

  const renderDevice = (device: SimulatorDeviceRow) => {
    if (editingUdid === device.udid) {
      const save = (): void => {
        void updateSettings({
          mobileEmulatorDeviceRemarks: withEmulatorDeviceRemark(remarks, device, remarkDraft)
        })
        setEditingUdid(null)
      }
      return (
        <EmulatorDeviceRemarkEditor
          key={device.udid}
          value={remarkDraft}
          onChange={setRemarkDraft}
          onSave={save}
          onCancel={() => setEditingUdid(null)}
        />
      )
    }
    const remark = emulatorDeviceRemark(device, remarks)
    return (
      <EmulatorDevicePickerRow
        key={device.udid}
        device={device}
        remark={remark}
        selected={device.udid === selectedUdid}
        onSelect={() => {
          onSelectDevice(device.udid)
          setSearch('')
          setOpen(false)
        }}
        onEditRemark={() => {
          setRemarkDraft(remark ?? '')
          setEditingUdid(device.udid)
        }}
      />
    )
  }
  const selectedRemark = selected ? emulatorDeviceRemark(selected, remarks) : undefined
  const filterButton = (value: boolean, label: string, count: number) => (
    <button
      type="button"
      className={cn(
        'rounded px-2 py-0.5 text-xs',
        onlineOnly === value ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
      )}
      onClick={() => setOnlineOnly(value)}
    >
      {label} {count}
    </button>
  )
  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) {
          setSearch('')
          setEditingUdid(null)
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          role="combobox"
          aria-expanded={open}
          aria-label={chooseLabel}
          disabled={disabled}
          className="h-7 w-72 justify-between"
        >
          <span className="truncate">
            {selected
              ? [
                  emulatorDeviceShortIp(selected.udid),
                  selectedRemark ?? selected.name,
                  emulatorDeviceDescription(selected)
                ]
                  .filter(Boolean)
                  .join(' · ')
              : chooseLabel}
          </span>
          <ChevronDown className="size-3.5 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[820px] max-w-[calc(100vw-2rem)] p-0" wheelScroll>
        <Command density="menu">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder={t('emulator.picker.search', 'Search devices…')}
              wrapperClassName="h-7 min-w-0 flex-1 rounded-md border border-border px-2"
              className="h-7 py-0 text-xs"
            />
            <div className="flex items-center rounded-md border border-border p-0.5">
              {filterButton(false, t('emulator.picker.all', 'All'), devices.length)}
              {filterButton(true, t('emulator.picker.online', 'Online'), onlineCount)}
            </div>
            <EmulatorNetworkConnectForm
              onConnect={async (address) => {
                await onConnectAddress(address)
                setOpen(false)
              }}
            />
          </div>
          <EmulatorDeviceKeywordBar
            keywords={keywords}
            counts={keywordCounts}
            active={keyword}
            onActiveChange={setKeyword}
            onKeywordsChange={(next) => void updateSettings({ mobileEmulatorDeviceKeywords: next })}
          />
          <div
            className={cn(
              EMULATOR_DEVICE_ROW_GRID,
              'border-b border-border px-4 py-1.5 text-xs text-muted-foreground'
            )}
          >
            <span>IP</span>
            <span>{t('emulator.picker.columnName', 'Name')}</span>
            <span>{t('emulator.picker.columnSystem', 'System')}</span>
            <span>SN</span>
            <span>key</span>
            <span>{t('emulator.picker.columnStatus', 'Status')}</span>
            <span />
          </div>
          <CommandList className="max-h-[min(640px,70vh)]">
            <CommandEmpty>{t('emulator.picker.empty', 'No matching devices')}</CommandEmpty>
            {groups.used.length > 0 && (
              <CommandGroup heading={t('emulator.picker.used', 'Used devices')}>
                {groups.used.map(renderDevice)}
              </CommandGroup>
            )}
            {groups.other.length > 0 && (
              <CommandGroup>
                {!expanded && (
                  <CommandItem
                    value="other-devices"
                    onSelect={() => setOtherOpen(!otherOpen)}
                    aria-expanded={otherOpen}
                    selection="palette"
                  >
                    <ChevronRight className={otherOpen ? 'rotate-90' : ''} />
                    {t('emulator.picker.other', 'Other devices on this computer')} (
                    {groups.other.length})
                  </CommandItem>
                )}
                {(expanded || otherOpen) && groups.other.map(renderDevice)}
              </CommandGroup>
            )}
            {groups.unavailable.length > 0 && (
              <CommandGroup>
                {!expanded && (
                  <CommandItem
                    value="unavailable-devices"
                    onSelect={() => setUnavailableOpen(!unavailableOpen)}
                    aria-expanded={unavailableOpen}
                    selection="palette"
                  >
                    <ChevronRight className={unavailableOpen ? 'rotate-90' : ''} />
                    {t('emulator.picker.unavailable', 'Unavailable runtimes')} (
                    {groups.unavailable.length})
                  </CommandItem>
                )}
                {(expanded || unavailableOpen) && groups.unavailable.map(renderDevice)}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
