import { describe, expect, it } from 'vitest'
import { parseConfig } from '../src/config/env.js'

const minimal = { DATABASE_URL: 'postgresql://user:pass@localhost:5432/db' }

describe('environment configuration', () => {
  it('applies safe defaults and treats empty values as unset', () => {
    const config = parseConfig({ ...minimal, PORT: '', SMTP_HOST: '' })

    expect(config.port).toBe(4000)
    expect(config.env).toBe('development')
    expect(config.mail.smtp).toBeNull()
    expect(config.contact.max).toBe(5)
  })

  it('normalizes URLs and origin lists', () => {
    const config = parseConfig({
      ...minimal,
      PUBLIC_SITE_URL: 'https://card.example.com/',
      CORS_ORIGINS: 'https://a.example, https://b.example/ ,',
    })

    expect(config.publicSiteUrl).toBe('https://card.example.com')
    expect(config.corsOrigins).toEqual(['https://a.example', 'https://b.example'])
  })

  it('requires a PostgreSQL DATABASE_URL', () => {
    expect(() => parseConfig({})).toThrow(/DATABASE_URL/)
    expect(() => parseConfig({ DATABASE_URL: 'mysql://x' })).toThrow(/PostgreSQL/)
  })

  it('requires MAIL_FROM when SMTP is configured', () => {
    expect(() => parseConfig({ ...minimal, SMTP_HOST: 'smtp.example.com' })).toThrow(/MAIL_FROM/)

    const config = parseConfig({
      ...minimal,
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_SECURE: 'true',
      SMTP_USER: 'user',
      SMTP_PASS: 'secret',
      MAIL_FROM: 'Website <no-reply@example.com>',
    })
    expect(config.mail.smtp).toEqual({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      user: 'user',
      pass: 'secret',
    })
  })

  it('ignores a frontend directory that has not been built', () => {
    const config = parseConfig({ ...minimal, FRONTEND_DIST_DIR: '/definitely/not/here' })
    expect(config.frontendDistDir).toBeNull()
  })
})
