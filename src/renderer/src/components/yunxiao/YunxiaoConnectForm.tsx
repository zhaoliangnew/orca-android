import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { yunxiaoClient } from '@/runtime/yunxiao/runtime-yunxiao-client'
import { openAppHttpLink } from '@/lib/browser/navigation/app-http-link-open'
import { useYunxiaoPage } from './yunxiao-page-store'

const TOKEN_HELP_URL = 'https://account-devops.aliyun.com/settings/personalAccessToken'

/** leniu: paste a Yunxiao personal access token; Orca stores it encrypted on this machine. */
export function YunxiaoConnectForm() {
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState<'connect' | 'scan' | null>(null)
  const refreshStatus = useYunxiaoPage((s) => s.refreshStatus)

  const connect = async (): Promise<void> => {
    setBusy('connect')
    try {
      const status = await yunxiaoClient.connect(token.trim())
      toast.success(`已连接云效：${status.user?.name ?? ''}`)
      setBusy('scan')
      // Yunxiao searches one project at a time: find the projects holding the user's work once.
      const scanned = await yunxiaoClient.scanProjects()
      toast.success(`找到 ${scanned.watchedProjects.length} 个有你工作项的项目`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(null)
      setToken('')
      void refreshStatus()
    }
  }

  return (
    <div className="mx-auto mt-16 flex w-full max-w-md flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 p-5">
      <div className="text-sm font-medium">连接云效</div>
      <p className="text-xs text-muted-foreground">
        填写云效个人访问令牌（需要项目协作的读写权限）。令牌加密保存在本机，只用来读写你的工作项。
      </p>
      <Input
        type="password"
        placeholder="pt-xxxxxxxx"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && token.trim() && !busy) {
            void connect()
          }
        }}
      />
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={(event) => openAppHttpLink(TOKEN_HELP_URL, { event })}
        >
          去云效创建令牌
        </button>
        <Button size="sm" disabled={!token.trim() || busy !== null} onClick={() => void connect()}>
          {busy === 'connect' ? '连接中…' : busy === 'scan' ? '正在查找你的项目…' : '连接'}
        </Button>
      </div>
    </div>
  )
}
