import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'
import type { YunxiaoConnectionStatus } from '../../../../shared/yunxiao/yunxiao-types'
import { useYunxiaoPage } from './yunxiao-page-store'

/** leniu: account line, re-scan of watched projects, and disconnect. */
export function YunxiaoPanelMenu({ status }: { status: YunxiaoConnectionStatus }) {
  const refreshStatus = useYunxiaoPage((s) => s.refreshStatus)
  const [scanning, setScanning] = useState(false)

  const rescan = async (): Promise<void> => {
    setScanning(true)
    const pending = toast.loading('正在查找有你工作项的项目…')
    try {
      const next = await yunxiaoClient.scanProjects()
      toast.success(`找到 ${next.watchedProjects.length} 个项目`, { id: pending })
      await refreshStatus()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error), { id: pending })
    } finally {
      setScanning(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label="云效设置">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {status.user?.name} · {status.organizationName ?? status.organizationId}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={scanning} onSelect={() => void rescan()}>
          重新扫描项目（当前 {status.watchedProjects.length} 个）
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            void yunxiaoClient
              .disconnect()
              .then(() => refreshStatus())
              .catch((error: unknown) => toast.error(String(error)))
          }
        >
          断开云效
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
