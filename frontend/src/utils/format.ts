import type { ExperienceDto } from '@/types'

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

/** Splits text on blank lines into paragraphs. */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/** Whole years since the earliest experience start date. */
export function yearsOfExperience(experience: ExperienceDto[], now = new Date()): number | null {
  const starts = experience
    .map((item) => Date.parse(item.startDate))
    .filter((t) => !Number.isNaN(t))
  if (starts.length === 0) return null
  const years = (now.getTime() - Math.min(...starts)) / (365.25 * 24 * 60 * 60 * 1000)
  return Math.max(0, Math.floor(years))
}

export function formatYearRange(startDate: string, endDate: string | null): string {
  const start = startDate.slice(0, 4)
  return `${start} — ${endDate ? endDate.slice(0, 4) : 'Present'}`
}

/** ASCII slug for file names, e.g. "João Pérez" → "joao-perez". */
export function toSlug(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'contact'
  )
}
