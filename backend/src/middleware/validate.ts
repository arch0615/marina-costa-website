import type { RequestHandler } from 'express'
import { z } from 'zod'
import type { FieldErrors } from '@presence/shared'
import { AppError } from '../utils/errors.js'

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const { formErrors, fieldErrors } = z.flattenError(error)
  const details: FieldErrors = {}
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0) details[field] = messages as string[]
  }
  if (formErrors.length > 0) details._form = formErrors
  return details
}

/** Validates and sanitizes `req.body` with a Zod schema; unknown keys are stripped. */
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {})
    if (!result.success) {
      next(AppError.validation(toFieldErrors(result.error)))
      return
    }
    req.body = result.data
    next()
  }
}

/** Rejects non-JSON bodies, which also blocks cross-site HTML form posts. */
export const requireJson: RequestHandler = (req, _res, next) => {
  if (!req.is('application/json')) {
    next(new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Requests must be sent as JSON.'))
    return
  }
  next()
}
