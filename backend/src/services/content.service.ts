import type { PortfolioItemDto, ServiceDto, TestimonialDto } from '@presence/shared'
import { DEFAULT_PROFILE_SLUG } from '../config/constants.js'
import type { Database } from '../config/database.js'

const activeForDefaultProfile = {
  isActive: true,
  profile: { slug: DEFAULT_PROFILE_SLUG },
} as const

/** Read-only access to the public website content. */
export class ContentService {
  constructor(private readonly db: Database) {}

  listServices(): Promise<ServiceDto[]> {
    return this.db.service.findMany({
      where: activeForDefaultProfile,
      orderBy: { displayOrder: 'asc' },
      select: { id: true, title: true, description: true, icon: true },
    })
  }

  listPortfolio(): Promise<PortfolioItemDto[]> {
    return this.db.portfolioItem.findMany({
      where: activeForDefaultProfile,
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        projectUrl: true,
        category: true,
        technologies: true,
        isFeatured: true,
      },
    })
  }

  listTestimonials(): Promise<TestimonialDto[]> {
    return this.db.testimonial.findMany({
      where: activeForDefaultProfile,
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        authorName: true,
        authorRole: true,
        authorCompany: true,
        authorImage: true,
        quote: true,
      },
    })
  }
}
