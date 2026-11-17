import type { ApiErrorCode, FieldErrors } from '@presence/shared'

/** An expected, client-facing error. Its message is safe to return in API responses. */
export class AppError extends Error {
  readonly statusCode: number
  readonly code: ApiErrorCode
  readonly details: FieldErrors | undefined

  constructor(statusCode: number, code: ApiErrorCode, message: string, details?: FieldErrors) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }

  static badRequest(message: string, details?: FieldErrors) {
    return new AppError(400, 'BAD_REQUEST', message, details)
  }

  static validation(details: FieldErrors) {
    return new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid.', details)
  }

  static notFound(message = 'The requested resource was not found.') {
    return new AppError(404, 'NOT_FOUND', message)
  }
}
