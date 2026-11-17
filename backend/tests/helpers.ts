import { inject } from 'vitest'
import { createApp } from '../src/app.js'
import { createDatabase, type Database } from '../src/config/database.js'
import { parseConfig, type AppConfig } from '../src/config/env.js'
import type { MailMessage, Mailer } from '../src/services/mail.service.js'
import { createLogger } from '../src/utils/logger.js'
import { seedDatabase } from '../prisma/seed-data.js'

export const TEST_SITE_URL = 'https://card.example.com'
export const ALLOWED_ORIGIN = 'https://allowed.example.com'

export function createTestConfig(overrides: Record<string, string> = {}): AppConfig {
  return parseConfig({
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    DATABASE_URL: inject('testDatabaseUrl'),
    PUBLIC_SITE_URL: TEST_SITE_URL,
    CORS_ORIGINS: ALLOWED_ORIGIN,
    FRONTEND_DIST_DIR: '',
    CONTACT_MIN_FILL_MS: '2000',
    ...overrides,
  })
}

export interface FakeMailer extends Mailer {
  sent: MailMessage[]
}

export function createFakeMailer(
  options: { fail?: boolean; configured?: boolean } = {},
): FakeMailer {
  const sent: MailMessage[] = []
  return {
    sent,
    isConfigured: options.configured ?? true,
    async send(message) {
      if (options.fail) throw new Error('SMTP connection refused')
      sent.push(message)
    },
  }
}

export const silentLogger = createLogger({ level: 'silent' })

let sharedDb: Database | undefined

/** One Prisma client per test file, connected to the test database. */
export function getTestDb(): Database {
  sharedDb ??= createDatabase(inject('testDatabaseUrl'))
  return sharedDb
}

/** Wipes every table and re-seeds the demo profile. */
export async function resetDatabase(db: Database = getTestDb()) {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE contact_submissions, services, portfolio_items, social_links, testimonials, experiences, qualifications, profiles CASCADE',
  )
  await seedDatabase(db, TEST_SITE_URL)
}

export function buildTestApp(options: { config?: AppConfig; mailer?: Mailer; db?: Database } = {}) {
  const config = options.config ?? createTestConfig()
  const mailer = options.mailer ?? createFakeMailer()
  const db = options.db ?? getTestDb()
  const { app, services } = createApp({ config, db, mailer, logger: silentLogger })
  return { app, config, mailer, db, services }
}

export const validContact = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+44 20 7946 0958',
  subject: 'New website project',
  message: 'Hello Marina, I would love to talk about redesigning our website next quarter.',
  elapsedMs: 8000,
}
