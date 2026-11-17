/**
 * Minimal, standards-compliant vCard 3.0 (RFC 2426) generator.
 * Version 3.0 is used because it has the broadest support across iOS, Android,
 * Outlook and Google Contacts.
 */

export interface VCardContact {
  fullName: string
  organization?: string | null
  title?: string | null
  email: string
  phone?: string | null
  whatsapp?: string | null
  website?: string | null
  /** Permanent URL of the digital business card. */
  cardUrl?: string | null
  location?: string | null
  note?: string | null
  socialProfiles?: { type: string; url: string }[]
  revision?: Date
}

const CRLF = '\r\n'
const MAX_LINE_OCTETS = 75

/** Escapes a TEXT value (RFC 2426 §4): backslash, comma, semicolon and newlines. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

/** URI values are not TEXT-escaped, but must never contain line breaks. */
function sanitizeUri(value: string): string {
  return value.replace(/[\r\n]/g, '').trim()
}

/** Normalizes a phone number to `+digits` for maximum compatibility. */
export function normalizePhone(value: string): string {
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, '')
  return trimmed.startsWith('+') ? `+${digits}` : digits
}

/**
 * Folds a content line to at most 75 octets per physical line (RFC 2425 §5.8.1),
 * never splitting a multi-byte UTF-8 character.
 */
export function foldLine(line: string): string {
  if (Buffer.byteLength(line, 'utf8') <= MAX_LINE_OCTETS) return line

  const parts: string[] = []
  let current = ''
  let currentOctets = 0
  // Continuation lines start with a space, which counts toward their 75 octets.
  let limit = MAX_LINE_OCTETS

  for (const char of line) {
    const octets = Buffer.byteLength(char, 'utf8')
    if (currentOctets + octets > limit) {
      parts.push(current)
      current = ''
      currentOctets = 0
      limit = MAX_LINE_OCTETS - 1
    }
    current += char
    currentOctets += octets
  }
  parts.push(current)
  return parts.join(`${CRLF} `)
}

/** Splits a full name into vCard `N` components: given names + family name (last word). */
export function splitName(fullName: string): { given: string; family: string } {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length <= 1) return { given: words[0] ?? '', family: '' }
  return { given: words.slice(0, -1).join(' '), family: words.at(-1) ?? '' }
}

function formatRevision(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

export function buildVCard(contact: VCardContact): string {
  const { given, family } = splitName(contact.fullName)
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'PRODID:-//Presence//Digital Business Card//EN',
    `N:${escapeText(family)};${escapeText(given)};;;`,
    `FN:${escapeText(contact.fullName.trim())}`,
  ]

  if (contact.organization) lines.push(`ORG:${escapeText(contact.organization)}`)
  if (contact.title) lines.push(`TITLE:${escapeText(contact.title)}`)

  const phone = contact.phone ? normalizePhone(contact.phone) : null
  const whatsapp = contact.whatsapp ? normalizePhone(contact.whatsapp) : null
  if (phone) lines.push(`TEL;TYPE=CELL,VOICE:${phone}`)
  if (whatsapp && whatsapp !== phone) {
    lines.push(`item1.TEL;TYPE=CELL:${whatsapp}`, 'item1.X-ABLabel:WhatsApp')
  }

  lines.push(`EMAIL;TYPE=INTERNET,PREF:${sanitizeUri(contact.email)}`)

  const website = contact.website ? sanitizeUri(contact.website) : null
  const cardUrl = contact.cardUrl ? sanitizeUri(contact.cardUrl) : null
  if (website) lines.push(`URL:${website}`)
  if (cardUrl && cardUrl !== website) {
    lines.push(`item2.URL:${cardUrl}`, 'item2.X-ABLabel:Digital card')
  }

  if (contact.location) lines.push(`ADR;TYPE=WORK:;;;${escapeText(contact.location)};;;`)
  if (contact.note) lines.push(`NOTE:${escapeText(contact.note)}`)

  for (const profile of contact.socialProfiles ?? []) {
    const type = profile.type.toLowerCase().replace(/[^a-z0-9-]/g, '')
    lines.push(`X-SOCIALPROFILE;TYPE=${type}:${sanitizeUri(profile.url)}`)
  }

  lines.push(`REV:${formatRevision(contact.revision ?? new Date())}`, 'END:VCARD')

  return lines.map(foldLine).join(CRLF) + CRLF
}

/** ASCII-only, filesystem-safe file name for the downloaded contact. */
export function vCardFileName(fullName: string): string {
  const slug = fullName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'contact'}.vcf`
}
