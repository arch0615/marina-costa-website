/**
 * The contact request schema lives in the shared package so the browser form and the
 * API enforce exactly the same rules. It trims input, strips control characters,
 * enforces lengths/formats and drops unknown fields.
 */
export { contactRequestSchema } from '@presence/shared'
