import type { ProfileDto } from '@presence/shared'
import { escapeHtml, toSafeJsonForHtml } from '../utils/html.js'
import type { Logger } from '../utils/logger.js'
import type { ProfileService } from './profile.service.js'

/** Routes rendered by the frontend application. */
export const SPA_ROUTES = ['/', '/card'] as const
export type SpaRoute = (typeof SPA_ROUTES)[number]

export const SEO_START = '<!--seo:start-->'
export const SEO_END = '<!--seo:end-->'

const PROFILE_CACHE_TTL_MS = 60_000

interface PageMeta {
  title: string
  description: string
  canonicalUrl: string | null
  imageUrl: string
  imageAlt: string
  noindex: boolean
}

export function isSpaRoute(pathname: string): pathname is SpaRoute {
  return (SPA_ROUTES as readonly string[]).includes(pathname)
}

function renderHeadTags(meta: PageMeta, jsonLd: unknown): string {
  const e = escapeHtml
  const tags = [
    `<title>${e(meta.title)}</title>`,
    `<meta name="description" content="${e(meta.description)}" />`,
    meta.noindex ? '<meta name="robots" content="noindex" />' : '',
    meta.canonicalUrl ? `<link rel="canonical" href="${e(meta.canonicalUrl)}" />` : '',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${e(meta.title)}" />`,
    `<meta property="og:description" content="${e(meta.description)}" />`,
    meta.canonicalUrl ? `<meta property="og:url" content="${e(meta.canonicalUrl)}" />` : '',
    `<meta property="og:image" content="${e(meta.imageUrl)}" />`,
    `<meta property="og:image:alt" content="${e(meta.imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(meta.title)}" />`,
    `<meta name="twitter:description" content="${e(meta.description)}" />`,
    `<meta name="twitter:image" content="${e(meta.imageUrl)}" />`,
    jsonLd ? `<script type="application/ld+json">${toSafeJsonForHtml(jsonLd)}</script>` : '',
  ]
  return tags.filter(Boolean).join('\n    ')
}

/**
 * Injects route-specific metadata into the built `index.html` so that link previews
 * (WhatsApp, LinkedIn, Slack, …) — which do not execute JavaScript — show the profile.
 */
export class SeoService {
  private cache: { profile: ProfileDto; expiresAt: number } | null = null

  constructor(
    private readonly options: {
      profiles: ProfileService
      publicSiteUrl: string
      logger: Logger
    },
  ) {}

  private async getProfile(): Promise<ProfileDto | null> {
    const now = Date.now()
    if (this.cache && this.cache.expiresAt > now) return this.cache.profile
    try {
      const profile = await this.options.profiles.getProfile()
      this.cache = { profile, expiresAt: now + PROFILE_CACHE_TTL_MS }
      return profile
    } catch (error) {
      this.options.logger.warn({ err: error }, 'Could not load profile for page metadata')
      return this.cache?.profile ?? null
    }
  }

  private buildMeta(route: SpaRoute | null, profile: ProfileDto): PageMeta {
    const site = this.options.publicSiteUrl
    const name = profile.fullName
    const base = {
      imageUrl: `${site}/og-image.png`,
      imageAlt: `${name} — ${profile.professionalTitle}`,
    }

    if (route === '/card') {
      return {
        ...base,
        title: `${name} · Digital Business Card`,
        description: `${profile.professionalTitle}${profile.companyName ? ` at ${profile.companyName}` : ''}. Save my contact, connect on social media or get in touch in one tap.`,
        canonicalUrl: `${site}/card`,
        noindex: false,
      }
    }

    if (route === '/') {
      return {
        ...base,
        title: `${name} — ${profile.professionalTitle}`,
        description: profile.headline,
        canonicalUrl: `${site}/`,
        noindex: false,
      }
    }

    return {
      ...base,
      title: `Page not found · ${name}`,
      description: profile.headline,
      canonicalUrl: null,
      noindex: true,
    }
  }

  private buildJsonLd(profile: ProfileDto): unknown {
    const site = this.options.publicSiteUrl
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.fullName,
      jobTitle: profile.professionalTitle,
      description: profile.headline,
      url: `${site}/`,
      email: `mailto:${profile.email}`,
      ...(profile.phone ? { telephone: profile.phone } : {}),
      ...(profile.companyName
        ? { worksFor: { '@type': 'Organization', name: profile.companyName } }
        : {}),
      ...(profile.location
        ? { address: { '@type': 'PostalAddress', addressLocality: profile.location } }
        : {}),
      ...(profile.profileImage
        ? { image: new URL(profile.profileImage, `${site}/`).toString() }
        : {}),
      sameAs: profile.socialLinks.map((link) => link.url),
    }
  }

  /** Returns the HTML for a request path, replacing the template's default SEO block. */
  async render(template: string, pathname: string): Promise<string> {
    const start = template.indexOf(SEO_START)
    const end = template.indexOf(SEO_END)
    if (start === -1 || end === -1) return template

    const profile = await this.getProfile()
    if (!profile) return template

    const route = isSpaRoute(pathname) ? pathname : null
    const meta = this.buildMeta(route, profile)
    const jsonLd = route === null ? null : this.buildJsonLd(profile)

    return (
      template.slice(0, start + SEO_START.length) +
      '\n    ' +
      renderHeadTags(meta, jsonLd) +
      '\n    ' +
      template.slice(end)
    )
  }
}
