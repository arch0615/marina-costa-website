import type { RequestHandler } from 'express'
import { CONTENT_CACHE_CONTROL } from '../config/constants.js'
import type { ProfileService } from '../services/profile.service.js'
import { sendData } from '../utils/respond.js'

export function createProfileController(profiles: ProfileService): { get: RequestHandler } {
  return {
    async get(_req, res) {
      sendData(res, await profiles.getProfile(), { cache: CONTENT_CACHE_CONTROL })
    },
  }
}
