import type { RequestHandler } from 'express'
import type { ContactRequest, ContactSubmissionResult } from '@presence/shared'
import type { ContactService } from '../services/contact.service.js'
import { sendData } from '../utils/respond.js'

const SUCCESS_MESSAGE = 'Thank you! Your message has been sent and I will get back to you soon.'

export function createContactController(contact: ContactService): { submit: RequestHandler } {
  return {
    async submit(req, res) {
      const outcome = await contact.submit(req.body as ContactRequest)

      if (outcome.kind === 'spam') {
        // Respond exactly like a real success so automated senders learn nothing.
        req.log.warn({ reason: outcome.reason }, 'Contact submission discarded as spam')
      } else {
        req.log.info({ submissionId: outcome.id }, 'Contact submission stored')
      }

      const result: ContactSubmissionResult = { message: SUCCESS_MESSAGE }
      sendData(res, result, { status: 201 })
    },
  }
}
