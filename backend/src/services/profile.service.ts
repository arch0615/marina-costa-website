import type { ProfileDto } from '@presence/shared'
import { DEFAULT_PROFILE_SLUG } from '../config/constants.js'
import type { Database } from '../config/database.js'
import { AppError } from '../utils/errors.js'

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10)

export class ProfileService {
  constructor(private readonly db: Database) {}

  /** Returns the public profile with its active social links, experience and qualifications. */
  async getProfile(): Promise<ProfileDto> {
    const profile = await this.db.profile.findUnique({
      where: { slug: DEFAULT_PROFILE_SLUG },
      include: {
        socialLinks: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          select: { id: true, platform: true, url: true },
        },
        experiences: { orderBy: { displayOrder: 'asc' } },
        qualifications: { orderBy: { displayOrder: 'asc' } },
      },
    })

    if (!profile) {
      throw AppError.notFound('The profile has not been configured yet.')
    }

    return {
      id: profile.id,
      fullName: profile.fullName,
      professionalTitle: profile.professionalTitle,
      companyName: profile.companyName,
      headline: profile.headline,
      biography: profile.biography,
      profileImage: profile.profileImage,
      email: profile.email,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      website: profile.website,
      location: profile.location,
      skills: profile.skills,
      socialLinks: profile.socialLinks,
      experience: profile.experiences.map((item) => ({
        id: item.id,
        role: item.role,
        organization: item.organization,
        startDate: toIsoDate(item.startDate),
        endDate: item.endDate ? toIsoDate(item.endDate) : null,
        description: item.description,
      })),
      qualifications: profile.qualifications.map((item) => ({
        id: item.id,
        title: item.title,
        institution: item.institution,
        year: item.year,
      })),
      updatedAt: profile.updatedAt.toISOString(),
    }
  }

  /** Minimal lookup used when storing contact submissions and sending notifications. */
  async getContactTarget(): Promise<{ id: string; fullName: string; email: string } | null> {
    return this.db.profile.findUnique({
      where: { slug: DEFAULT_PROFILE_SLUG },
      select: { id: true, fullName: true, email: true },
    })
  }
}
