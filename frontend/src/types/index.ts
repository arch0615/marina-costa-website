export type {
  ApiErrorBody,
  ApiErrorCode,
  ContactFormInput,
  ContactFormValues,
  ContactSubmissionResult,
  ExperienceDto,
  FieldErrors,
  PortfolioItemDto,
  ProfileDto,
  QualificationDto,
  ServiceDto,
  SocialLinkDto,
  SocialPlatform,
  TestimonialDto,
} from '@presence/shared'

/** Async data state used by data-fetching hooks. */
export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error }
  | { status: 'success'; data: T; error?: undefined }
