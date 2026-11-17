/** Data transfer objects returned by the REST API. Dates are ISO-8601 strings. */

export const SOCIAL_PLATFORMS = [
  'LINKEDIN',
  'INSTAGRAM',
  'FACEBOOK',
  'X',
  'YOUTUBE',
  'GITHUB',
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

export interface SocialLinkDto {
  id: string
  platform: SocialPlatform
  url: string
}

export interface ExperienceDto {
  id: string
  role: string
  organization: string
  startDate: string
  endDate: string | null
  description: string | null
}

export interface QualificationDto {
  id: string
  title: string
  institution: string
  year: number | null
}

export interface ProfileDto {
  id: string
  fullName: string
  professionalTitle: string
  companyName: string | null
  headline: string
  biography: string
  profileImage: string | null
  email: string
  phone: string | null
  whatsapp: string | null
  website: string | null
  location: string | null
  skills: string[]
  socialLinks: SocialLinkDto[]
  experience: ExperienceDto[]
  qualifications: QualificationDto[]
  updatedAt: string
}

export interface ServiceDto {
  id: string
  title: string
  description: string
  icon: string
}

export interface PortfolioItemDto {
  id: string
  title: string
  description: string
  image: string | null
  projectUrl: string | null
  category: string
  technologies: string[]
  isFeatured: boolean
}

export interface TestimonialDto {
  id: string
  authorName: string
  authorRole: string | null
  authorCompany: string | null
  authorImage: string | null
  quote: string
}

export interface HealthDto {
  status: 'ok' | 'degraded'
  database: 'up' | 'down'
  uptimeSeconds: number
  timestamp: string
}

export interface ContactSubmissionResult {
  message: string
}

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'

export type FieldErrors = Record<string, string[]>

export interface ApiSuccess<T> {
  data: T
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    details?: FieldErrors
    requestId?: string
  }
}
