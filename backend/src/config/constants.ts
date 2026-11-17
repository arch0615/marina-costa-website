/** Slug of the single profile served by this deployment (must match prisma/seed-data.ts). */
export const DEFAULT_PROFILE_SLUG = 'default'

/** Maximum accepted JSON body size. Contact messages are well below this. */
export const JSON_BODY_LIMIT = '16kb'

/** Short-lived public caching for read-only content endpoints. */
export const CONTENT_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300'
