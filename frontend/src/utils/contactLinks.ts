/** Builders for links that open the phone dialer, email client, WhatsApp or maps. */

const digitsOnly = (value: string) => value.replace(/\D/g, '')

/** Allows only http(s) URLs so stored data can never inject `javascript:` links. */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null
  } catch {
    return null
  }
}

/** `tel:` link in international format, e.g. `tel:+12125550148`. */
export function phoneHref(phone: string): string {
  const trimmed = phone.trim()
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digitsOnly(trimmed)}`
}

export function emailHref(
  email: string,
  options: { subject?: string; body?: string } = {},
): string {
  const params = new URLSearchParams()
  if (options.subject) params.set('subject', options.subject)
  if (options.body) params.set('body', options.body)
  // mailto expects %20 for spaces, not "+".
  const query = params.toString().replace(/\+/g, '%20')
  return `mailto:${email}${query ? `?${query}` : ''}`
}

/** Opens a WhatsApp chat with the given number (international format, any punctuation). */
export function whatsappHref(number: string, message?: string): string {
  const base = `https://wa.me/${digitsOnly(number)}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/** Opens WhatsApp with a pre-filled message and lets the user pick the recipient. */
export function whatsappShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function mapsHref(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

/** Props for links that open in a new tab without leaking the opener. */
export const externalLinkProps = { target: '_blank', rel: 'noopener noreferrer' } as const
