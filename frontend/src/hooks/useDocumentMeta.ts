import { useEffect } from 'react'
import { getSiteUrl } from '@/utils/siteConfig'

interface DocumentMeta {
  /** When undefined (e.g. while data loads) the current tags are left as they are. */
  title: string | undefined
  description?: string | undefined
  /** Path of the canonical URL, e.g. "/card". Omit to leave the canonical untouched. */
  path?: string
  noindex?: boolean
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = href
}

/**
 * Keeps the document title and social metadata in sync with the current route.
 * The server already injects these tags for crawlers; this updates them during
 * client-side navigation.
 */
export function useDocumentMeta({ title, description, path, noindex = false }: DocumentMeta) {
  useEffect(() => {
    if (!title) return
    document.title = title
    upsertMeta('property', 'og:title', title)
    upsertMeta('name', 'twitter:title', title)

    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }

    if (path !== undefined) {
      const url = `${getSiteUrl()}${path}`
      upsertCanonical(url)
      upsertMeta('property', 'og:url', url)
    }

    const robots = document.head.querySelector('meta[name="robots"]')
    if (noindex) upsertMeta('name', 'robots', 'noindex')
    else robots?.remove()
  }, [title, description, path, noindex])
}
