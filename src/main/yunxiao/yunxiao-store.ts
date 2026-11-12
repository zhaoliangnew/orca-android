import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { writeEncryptedCredential } from '../credentials/integration-credential-file'
import { createIntegrationTokenFileCache } from '../credentials/integration-token-file-cache'
import type {
  YunxiaoProject,
  YunxiaoUser,
  YunxiaoWorkspaceLink
} from '../../shared/yunxiao/yunxiao-types'

/** leniu: the Yunxiao connection — the token encrypted on its own, the rest as plain JSON. */
export type YunxiaoState = {
  version: 1
  organizationId: string | null
  organizationName: string | null
  user: YunxiaoUser | null
  watchedProjects: YunxiaoProject[]
  lastScannedAt: number
  links: YunxiaoWorkspaceLink[]
}

const TOKEN_ID = 'default'
// ORCA_YUNXIAO_STATE_DIR lets a dev build keep its own connection beside the installed app's.
const orcaDir = (): string => process.env.ORCA_YUNXIAO_STATE_DIR || join(homedir(), '.orca')
const statePath = (): string => join(orcaDir(), 'yunxiao.json')
const tokenPath = (): string => join(orcaDir(), 'yunxiao-token.enc')
const tokenCache = createIntegrationTokenFileCache({ service: 'Yunxiao', filePath: tokenPath })

function emptyState(): YunxiaoState {
  return {
    version: 1,
    organizationId: null,
    organizationName: null,
    user: null,
    watchedProjects: [],
    lastScannedAt: 0,
    links: []
  }
}

export function readYunxiaoState(): YunxiaoState {
  try {
    const parsed = JSON.parse(readFileSync(statePath(), 'utf-8')) as Partial<YunxiaoState>
    return { ...emptyState(), ...parsed, version: 1 }
  } catch {
    return emptyState()
  }
}

export function writeYunxiaoState(next: YunxiaoState): void {
  if (!existsSync(orcaDir())) {
    mkdirSync(orcaDir(), { recursive: true })
  }
  writeFileSync(statePath(), `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 })
}

export function updateYunxiaoState(update: (state: YunxiaoState) => YunxiaoState): YunxiaoState {
  const next = update(readYunxiaoState())
  writeYunxiaoState(next)
  return next
}

export function readYunxiaoToken(): string | null {
  return tokenCache.read(TOKEN_ID)
}

export function saveYunxiaoToken(token: string): void {
  if (!existsSync(orcaDir())) {
    mkdirSync(orcaDir(), { recursive: true })
  }
  writeEncryptedCredential('Yunxiao', tokenPath(), token)
  tokenCache.forget(TOKEN_ID)
}

export function clearYunxiaoConnection(): void {
  try {
    unlinkSync(tokenPath())
  } catch {
    // Already gone.
  }
  tokenCache.forget(TOKEN_ID)
  // Keep workspace links: they still name the work items after a reconnect.
  updateYunxiaoState((state) => ({ ...emptyState(), links: state.links }))
}
