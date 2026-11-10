import type { RateLimitState } from '../../shared/rate-limit-types'

// leniu: usage refreshes only from the status bar refresh button; every automatic fetch path checks this.
export const LENIU_MANUAL_USAGE_REFRESH_ONLY = true

/** Settings and credential changes keep their invalidation but skip the follow-up provider fetch. */
export async function refreshUnlessManualOnly(rateLimits: {
  refresh: () => Promise<RateLimitState>
}): Promise<void> {
  if (!LENIU_MANUAL_USAGE_REFRESH_ONLY) {
    await rateLimits.refresh()
  }
}
