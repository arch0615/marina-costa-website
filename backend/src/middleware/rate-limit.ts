import { rateLimit } from 'express-rate-limit'
import { AppError } from '../utils/errors.js'

interface LimiterOptions {
  windowMs: number
  max: number
  message: string
}

export function createRateLimiter({ windowMs, max, message }: LimiterOptions) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new AppError(429, 'RATE_LIMITED', message)),
  })
}
