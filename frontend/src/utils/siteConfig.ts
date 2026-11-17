const trimSlash = (value: string) => value.replace(/\/+$/, '')

/** Base URL of the REST API. Empty means same origin (dev proxy or single-origin deployment). */
export const API_BASE_URL = trimSlash(import.meta.env.VITE_API_URL ?? '')

/**
 * Permanent public URL of the site. Configured at build time so that QR codes and
 * shared links always point to the production address, never to a preview host.
 */
export function getSiteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL
  if (configured) return trimSlash(configured)
  return typeof window === 'undefined' ? '' : window.location.origin
}

/** Permanent URL of the digital business card (encoded in the QR code). */
export function getCardUrl(): string {
  return `${getSiteUrl()}/card`
}

/** Absolute URL for the vCard download endpoint. */
export const VCARD_URL = `${API_BASE_URL}/api/vcard`

/** Navigation entries for the presentation page sections. */
export const SECTION_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'contact', label: 'Contact' },
] as const

export type SectionId = (typeof SECTION_LINKS)[number]['id']
