import { existsSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

const booleanFromString = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1')

const commaSeparated = z.string().transform((value) =>
  value
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean),
)

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),

    DATABASE_URL: z
      .string({ error: 'DATABASE_URL is required' })
      .regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must be a PostgreSQL connection string'),

    PUBLIC_SITE_URL: z
      .url()
      .default('http://localhost:5180')
      .transform((value) => value.replace(/\/+$/, '')),
    CORS_ORIGINS: commaSeparated.default([]),
    FRONTEND_DIST_DIR: z.string().default(''),

    RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    CONTACT_RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60 * 60_000),
    CONTACT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
    CONTACT_MIN_FILL_MS: z.coerce.number().int().nonnegative().default(3000),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(587),
    SMTP_SECURE: booleanFromString.default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().optional(),
    CONTACT_RECIPIENT: z.email().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.SMTP_HOST && !env.MAIL_FROM) {
      ctx.addIssue({
        code: 'custom',
        path: ['MAIL_FROM'],
        message: 'MAIL_FROM is required when SMTP_HOST is set',
      })
    }
  })

export type NodeEnv = 'development' | 'test' | 'production'

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
}

export interface AppConfig {
  env: NodeEnv
  isProduction: boolean
  port: number
  logLevel: string
  trustProxy: number
  databaseUrl: string
  publicSiteUrl: string
  corsOrigins: string[]
  /** Absolute path to the built frontend, or null when the API runs standalone. */
  frontendDistDir: string | null
  rateLimit: { windowMs: number; max: number }
  contact: { windowMs: number; max: number; minFillMs: number }
  mail: { smtp: SmtpConfig | null; from: string | null; recipient: string | null }
}

/** Parses and validates environment variables. Throws a readable error listing every problem. */
export function parseConfig(source: NodeJS.ProcessEnv, baseDir = process.cwd()): AppConfig {
  // Treat empty values (e.g. `SMTP_HOST=`) as "not set" so defaults apply.
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value.trim() !== ''),
  )

  const result = envSchema.safeParse(cleaned)
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${problems}`)
  }

  const env = result.data
  const distDir = env.FRONTEND_DIST_DIR ? path.resolve(baseDir, env.FRONTEND_DIST_DIR) : null

  return {
    env: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    trustProxy: env.TRUST_PROXY,
    databaseUrl: env.DATABASE_URL,
    publicSiteUrl: env.PUBLIC_SITE_URL,
    corsOrigins: env.CORS_ORIGINS,
    frontendDistDir: distDir && existsSync(path.join(distDir, 'index.html')) ? distDir : null,
    rateLimit: { windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX },
    contact: {
      windowMs: env.CONTACT_RATE_LIMIT_WINDOW_MS,
      max: env.CONTACT_RATE_LIMIT_MAX,
      minFillMs: env.CONTACT_MIN_FILL_MS,
    },
    mail: {
      smtp: env.SMTP_HOST
        ? {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            ...(env.SMTP_USER ? { user: env.SMTP_USER } : {}),
            ...(env.SMTP_PASS ? { pass: env.SMTP_PASS } : {}),
          }
        : null,
      from: env.MAIL_FROM ?? null,
      recipient: env.CONTACT_RECIPIENT ?? null,
    },
  }
}

/** Loads `.env` (if present) and returns the validated configuration. */
export function loadConfig(): AppConfig {
  if (existsSync('.env')) process.loadEnvFile('.env')
  return parseConfig(process.env)
}
