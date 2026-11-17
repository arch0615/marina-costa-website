import { useEffect } from 'react'
import { useLocation } from 'react-router'

/**
 * Scrolls to the top on page changes, or to the target section when the URL has a
 * hash (e.g. arriving at "/#portfolio" from the digital card). Sections may still be
 * loading their data, so the scroll is corrected once more after content settles.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 })
      return
    }
    const id = decodeURIComponent(hash.slice(1))
    const scroll = () => document.getElementById(id)?.scrollIntoView({ block: 'start' })
    const timers = [0, 350, 900].map((delay) => window.setTimeout(scroll, delay))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [pathname, hash])

  return null
}
