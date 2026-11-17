import type { RequestHandler } from 'express'
import { CONTENT_CACHE_CONTROL } from '../config/constants.js'
import type { ContentService } from '../services/content.service.js'
import { sendData } from '../utils/respond.js'

export function createContentController(content: ContentService) {
  const cache = { cache: CONTENT_CACHE_CONTROL }
  return {
    services: (async (_req, res) => {
      sendData(res, await content.listServices(), cache)
    }) satisfies RequestHandler,
    portfolio: (async (_req, res) => {
      sendData(res, await content.listPortfolio(), cache)
    }) satisfies RequestHandler,
    testimonials: (async (_req, res) => {
      sendData(res, await content.listTestimonials(), cache)
    }) satisfies RequestHandler,
  }
}
