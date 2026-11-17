import { Router } from 'express'
import type { AppConfig } from '../config/env.js'
import type { Database } from '../config/database.js'
import { createContactController } from '../controllers/contact.controller.js'
import { createContentController } from '../controllers/content.controller.js'
import { createHealthController } from '../controllers/health.controller.js'
import { createProfileController } from '../controllers/profile.controller.js'
import { createVCardController } from '../controllers/vcard.controller.js'
import { createRateLimiter } from '../middleware/rate-limit.js'
import { requireJson, validateBody } from '../middleware/validate.js'
import type { ContactService } from '../services/contact.service.js'
import type { ContentService } from '../services/content.service.js'
import type { ProfileService } from '../services/profile.service.js'
import { contactRequestSchema } from '../validators/contact.validator.js'

export interface ApiRouterDependencies {
  config: AppConfig
  db: Database
  profiles: ProfileService
  content: ContentService
  contact: ContactService
}

export function createApiRouter({ config, db, profiles, content, contact }: ApiRouterDependencies) {
  const router = Router()

  const health = createHealthController(db)
  const profile = createProfileController(profiles)
  const contentController = createContentController(content)
  const vcard = createVCardController(profiles, config.publicSiteUrl)
  const contactController = createContactController(contact)

  const contactLimiter = createRateLimiter({
    windowMs: config.contact.windowMs,
    max: config.contact.max,
    message: 'You have sent several messages recently. Please try again later.',
  })

  router.get('/health', health.check)
  router.get('/profile', profile.get)
  router.get('/services', contentController.services)
  router.get('/portfolio', contentController.portfolio)
  router.get('/testimonials', contentController.testimonials)
  router.get('/vcard', vcard.download)
  router.post(
    '/contact',
    contactLimiter,
    requireJson,
    validateBody(contactRequestSchema),
    contactController.submit,
  )

  return router
}
