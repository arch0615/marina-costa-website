import { useCallback, useEffect, useRef, useState } from 'react'

function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}

/** Copies text using the Clipboard API, falling back to `execCommand` on older browsers. */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Permission denied or unavailable: try the legacy path.
    }
  }
  return legacyCopy(text)
}

export function useCopyToClipboard(resetAfterMs = 2000) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyText(text)
      setCopied(ok)
      clearTimeout(timer.current)
      if (ok) timer.current = setTimeout(() => setCopied(false), resetAfterMs)
      return ok
    },
    [resetAfterMs],
  )

  return { copied, copy }
}
