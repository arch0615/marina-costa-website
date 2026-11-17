import type { ContactFormValues, ContactSubmissionResult } from '@/types'
import { apiRequest } from './apiClient'

export interface ContactSubmission extends ContactFormValues {
  /** Honeypot: must stay empty. */
  botField?: string
  /** How long the form was open, in milliseconds. */
  elapsedMs?: number
}

export function submitContact(submission: ContactSubmission) {
  return apiRequest<ContactSubmissionResult>('/contact', { method: 'POST', body: submission })
}
