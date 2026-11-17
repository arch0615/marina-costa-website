import { useCallback, useState } from 'react'

export interface SharePayload {
  title: string
  text: string
  url: string
}

export type ShareResult = 'shared' | 'cancelled' | 'fallback'

export function canUseNativeShare(payload: SharePayload): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false
  return typeof navigator.canShare === 'function' ? navigator.canShare(payload) : true
}

/**
 * Shares with the Web Share API when available; otherwise (or if it fails)
 * opens the fallback share dialog.
 */
export function useShare() {
  const [fallbackOpen, setFallbackOpen] = useState(false)

  const share = useCallback(async (payload: SharePayload): Promise<ShareResult> => {
    if (canUseNativeShare(payload)) {
      try {
        await navigator.share(payload)
        return 'shared'
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      }
    }
    setFallbackOpen(true)
    return 'fallback'
  }, [])

  return { share, fallbackOpen, setFallbackOpen }
}
