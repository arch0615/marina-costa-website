import type { ContactRequest } from '@presence/shared'
import type { Database } from '../config/database.js'
import { escapeHtml } from '../utils/html.js'
import type { Logger } from '../utils/logger.js'
import type { Mailer } from './mail.service.js'
import type { ProfileService } from './profile.service.js'

export interface ContactServiceOptions {
  db: Database
  mailer: Mailer
  profiles: ProfileService
  logger: Logger
  minFillMs: number
  /** Overrides the profile email as notification recipient. */
  recipient: string | null
}

export type SubmissionOutcome =
  | { kind: 'stored'; id: string; notification: Promise<void> }
  | { kind: 'spam'; reason: 'honeypot' | 'too-fast' }

export class ContactService {
  constructor(private readonly options: ContactServiceOptions) {}

  /** Returns a spam reason, or null when the submission looks human. */
  detectSpam(request: ContactRequest): 'honeypot' | 'too-fast' | null {
    if (request.botField && request.botField.trim() !== '') return 'honeypot'
    if (request.elapsedMs !== undefined && request.elapsedMs < this.options.minFillMs) {
      return 'too-fast'
    }
    return null
  }

  /**
   * Stores a validated submission and starts the email notification in the background.
   * Spam is silently dropped (the caller still responds with success so bots learn nothing).
   */
  async submit(request: ContactRequest): Promise<SubmissionOutcome> {
    const spamReason = this.detectSpam(request)
    if (spamReason) return { kind: 'spam', reason: spamReason }

    const target = await this.options.profiles.getContactTarget()

    const submission = await this.options.db.contactSubmission.create({
      data: {
        profileId: target?.id ?? null,
        name: request.name,
        email: request.email,
        phone: request.phone ? request.phone : null,
        subject: request.subject,
        message: request.message,
      },
      select: { id: true, name: true, email: true, phone: true, subject: true, message: true },
    })

    const recipient = this.options.recipient ?? target?.email ?? null
    const notification = this.notify(submission, recipient)
    return { kind: 'stored', id: submission.id, notification }
  }

  private async notify(
    submission: {
      id: string
      name: string
      email: string
      phone: string | null
      subject: string
      message: string
    },
    recipient: string | null,
  ): Promise<void> {
    const { mailer, logger, db } = this.options
    if (!mailer.isConfigured || !recipient) {
      logger.info(
        { submissionId: submission.id },
        'Email notification skipped (SMTP not configured)',
      )
      return
    }

    try {
      await mailer.send({
        to: recipient,
        replyTo: submission.email,
        subject: `New website enquiry: ${submission.subject}`,
        text: buildText(submission),
        html: buildHtml(submission),
      })
      await db.contactSubmission.update({
        where: { id: submission.id },
        data: { notifiedAt: new Date() },
      })
      logger.info({ submissionId: submission.id }, 'Email notification sent')
    } catch (error) {
      logger.error({ err: error, submissionId: submission.id }, 'Email notification failed')
    }
  }
}

interface NotificationFields {
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
}

function buildText(s: NotificationFields): string {
  return [
    'You received a new message from your website contact form.',
    '',
    `Name:    ${s.name}`,
    `Email:   ${s.email}`,
    `Phone:   ${s.phone ?? '—'}`,
    `Subject: ${s.subject}`,
    '',
    s.message,
  ].join('\n')
}

function buildHtml(s: NotificationFields): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 16px 4px 0;color:#6b7280">${label}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`

  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#111827;line-height:1.5">
<p>You received a new message from your website contact form.</p>
<table style="border-collapse:collapse">${row('Name', s.name)}${row('Email', s.email)}${row('Phone', s.phone ?? '—')}${row('Subject', s.subject)}</table>
<p style="white-space:pre-wrap;border-left:3px solid #e5e7eb;padding-left:12px">${escapeHtml(s.message)}</p>
</body></html>`
}
