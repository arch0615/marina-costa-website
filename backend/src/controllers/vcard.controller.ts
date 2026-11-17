import type { RequestHandler } from 'express'
import type { ProfileService } from '../services/profile.service.js'
import { buildVCard, vCardFileName } from '../utils/vcard.js'

/** Serves the profile as a downloadable vCard (.vcf) file. */
export function createVCardController(
  profiles: ProfileService,
  publicSiteUrl: string,
): { download: RequestHandler } {
  return {
    async download(_req, res) {
      const profile = await profiles.getProfile()
      const vcard = buildVCard({
        fullName: profile.fullName,
        organization: profile.companyName,
        title: profile.professionalTitle,
        email: profile.email,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        website: profile.website,
        cardUrl: `${publicSiteUrl}/card`,
        location: profile.location,
        note: profile.headline,
        socialProfiles: profile.socialLinks.map((link) => ({ type: link.platform, url: link.url })),
        revision: new Date(profile.updatedAt),
      })

      const fileName = vCardFileName(profile.fullName)
      res.set({
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache',
      })
      res.send(vcard)
    },
  }
}
