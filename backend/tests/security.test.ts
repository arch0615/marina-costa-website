import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { ALLOWED_ORIGIN, buildTestApp, createTestConfig, resetDatabase } from './helpers.js'

describe('security headers and CORS', () => {
  beforeAll(() => resetDatabase())

  it('sets secure HTTP headers', async () => {
    const { app } = buildTestApp()
    const res = await request(app).get('/api/health')

    expect(res.headers['content-security-policy']).toContain("default-src 'self'")
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(res.headers['x-powered-by']).toBeUndefined()
    // The test site URL is HTTPS, so HSTS is enabled.
    expect(res.headers['strict-transport-security']).toContain('max-age=')
  })

  it('does not send HSTS when the site is served over plain HTTP', async () => {
    const config = createTestConfig({ PUBLIC_SITE_URL: 'http://localhost:5173' })
    const { app } = buildTestApp({ config })
    const res = await request(app).get('/api/health')

    expect(res.headers['strict-transport-security']).toBeUndefined()
  })

  it('allows approved origins', async () => {
    const { app } = buildTestApp()
    const res = await request(app).get('/api/services').set('Origin', ALLOWED_ORIGIN)

    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN)
  })

  it('does not grant CORS access to other origins', async () => {
    const { app } = buildTestApp()
    const res = await request(app).get('/api/services').set('Origin', 'https://evil.example')

    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('answers preflight requests for approved origins', async () => {
    const { app } = buildTestApp()
    const res = await request(app)
      .options('/api/contact')
      .set('Origin', ALLOWED_ORIGIN)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type')

    expect(res.status).toBe(204)
    expect(res.headers['access-control-allow-methods']).toContain('POST')
  })
})
