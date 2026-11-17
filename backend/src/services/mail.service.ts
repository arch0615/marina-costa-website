import nodemailer from 'nodemailer'
import type { AppConfig } from '../config/env.js'

export interface MailMessage {
  to: string
  subject: string
  text: string
  html: string
  replyTo?: string
}

/** Abstraction over the email transport so it can be replaced in tests. */
export interface Mailer {
  readonly isConfigured: boolean
  send(message: MailMessage): Promise<void>
}

/** Used when SMTP is not configured: notifications are skipped, submissions are still stored. */
export const disabledMailer: Mailer = {
  isConfigured: false,
  send: () => Promise.reject(new Error('Email delivery is not configured')),
}

export function createMailer(mail: AppConfig['mail']): Mailer {
  const { smtp, from } = mail
  if (!smtp || !from) return disabledMailer

  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    ...(smtp.user ? { auth: { user: smtp.user, pass: smtp.pass ?? '' } } : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })

  return {
    isConfigured: true,
    async send(message) {
      await transport.sendMail({ from, ...message })
    },
  }
}
