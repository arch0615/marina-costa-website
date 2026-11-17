import type { ErrorRequestHandler, RequestHandler } from 'express'
import type { ApiErrorBody } from '@presence/shared'
import { AppError } from '../utils/errors.js'

interface BodyParserError {
  type: string
  status?: number
}

function isBodyParserError(error: unknown): error is BodyParserError {
  return typeof error === 'object' && error !== null && 'type' in error && 'status' in error
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const { name, code } = error as { name?: string; code?: string }
  return (
    name === 'PrismaClientInitializationError' ||
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'ECONNREFUSED'
  )
}

function normalize(error: unknown): AppError {
  if (error instanceof AppError) return error

  if (isBodyParserError(error)) {
    if (error.type === 'entity.too.large') {
      return new AppError(413, 'PAYLOAD_TOO_LARGE', 'The request body is too large.')
    }
    if (error.type === 'entity.parse.failed') {
      return AppError.badRequest('The request body contains invalid JSON.')
    }
    return AppError.badRequest('The request could not be processed.')
  }

  if (isDatabaseUnavailable(error)) {
    return new AppError(
      503,
      'SERVICE_UNAVAILABLE',
      'The service is temporarily unavailable. Please try again shortly.',
    )
  }

  return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again later.')
}

/** Centralized error handler: consistent JSON errors, no stack traces or internals exposed. */
export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }

  const appError = normalize(error)
  const requestId = typeof req.id === 'string' ? req.id : undefined

  if (appError.statusCode >= 500) {
    req.log.error({ err: error }, 'Request failed')
  } else {
    req.log.debug({ code: appError.code }, appError.message)
  }

  const body: ApiErrorBody = {
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details ? { details: appError.details } : {}),
      ...(requestId ? { requestId } : {}),
    },
  }
  res.status(appError.statusCode).json(body)
}

export const apiNotFound: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`No endpoint matches ${req.method} ${req.baseUrl}${req.path}.`))
}
