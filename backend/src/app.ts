import express, { type Express } from 'express'
import { JSON_BODY_LIMIT } from './config/constants.js'
import type { Database } from './config/database.js'
import type { AppConfig } from './config/env.js'
import { apiNotFound, errorHandler } from './middleware/error-handler.js'
import { createRateLimiter } from './middleware/rate-limit.js'
import { createRequestLogger } from './middleware/request-logger.js'
import { createCors, createSecurityHeaders } from './middleware/security.js'
import { createApiRouter } from './routes/api.routes.js'
import { createSpaRouter } from './routes/spa.routes.js'
import { ContactService } from './services/contact.service.js'
import { ContentService } from './services/content.service.js'
import type { Mailer } from './services/mail.service.js'
import { ProfileService } from './services/profile.service.js'
import { SeoService } from './services/seo.service.js'
import { AppError } from './utils/errors.js'
import type { Logger } from './utils/logger.js'

export interface AppDependencies {
  config: AppConfig
  db: Database
  mailer: Mailer
  logger: Logger
}

export interface AppInstance {
  app: Express
  services: { profiles: ProfileService; content: ContentService; contact: ContactService }
}

export function createApp({ config, db, mailer, logger }: AppDependencies): AppInstance {
  const profiles = new ProfileService(db)
  const content = new ContentService(db)
  const contact = new ContactService({
    db,
    mailer,
    profiles,
    logger,
    minFillMs: config.contact.minFillMs,
    recipient: config.mail.recipient,
  })

  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.trustProxy)

  app.use(createRequestLogger(logger))
  app.use(createSecurityHeaders(config))

  app.use(
    '/api',
    createCors(config),
    createRateLimiter({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: 'Too many requests. Please slow down and try again shortly.',
    }),
    express.json({ limit: JSON_BODY_LIMIT, strict: true }),
    createApiRouter({ config, db, profiles, content, contact }),
    apiNotFound,
  )

  if (config.frontendDistDir) {
    const seo = new SeoService({ profiles, publicSiteUrl: config.publicSiteUrl, logger })
    app.use(createSpaRouter(config.frontendDistDir, seo))
  } else {
    app.use((_req, _res, next) => next(AppError.notFound()))
  }

  app.use(errorHandler)

  return { app, services: { profiles, content, contact } }
}
