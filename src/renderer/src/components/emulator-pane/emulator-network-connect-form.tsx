import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslate } from '@/i18n/use-translate'

type Props = {
  onConnect: (address: string) => Promise<void>
}

// leniu: connect a networked Android board by IP and start mirroring it in one step.
export function EmulatorNetworkConnectForm({ onConnect }: Props) {
  const t = useTranslate()
  const [address, setAddress] = useState('192.168.')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault()
    if (connecting || !address.trim()) {
      return
    }
    setConnecting(true)
    setError(null)
    try {
      await onConnect(address.trim())
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : String(connectError))
    } finally {
      setConnecting(false)
    }
  }

  return (
    <>
      <form className="flex items-center gap-1.5" onSubmit={(event) => void submit(event)}>
        <Input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          // Keep cmdk from treating arrow/Enter keys as list navigation.
          onKeyDown={(event) => event.stopPropagation()}
          placeholder={t('emulator.picker.connectPlaceholder', 'Device IP, e.g. 192.168.9.184')}
          aria-label={t('emulator.picker.connectPlaceholder', 'Device IP, e.g. 192.168.9.184')}
          className="h-7 w-40 font-mono text-xs"
          disabled={connecting}
        />
        <Button type="submit" size="xs" className="h-7" disabled={connecting || !address.trim()}>
          {connecting ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {t('emulator.picker.connect', 'Connect')}
        </Button>
      </form>
      {error ? <p className="basis-full text-xs break-all text-destructive">{error}</p> : null}
    </>
  )
}
