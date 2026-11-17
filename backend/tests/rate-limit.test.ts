import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { buildTestApp, createTestConfig, resetDatabase, validContact } from './helpers.js'

describe('rate limiting', () => {
  beforeEach(() => resetDatabase())

  it('limits contact submissions per client', async () => {
    const config = createTestConfig({ CONTACT_RATE_LIMIT_MAX: '2' })
    const { app } = buildTestApp({ config })

    await request(app).post('/api/contact').send(validContact).expect(201)
    await request(app).post('/api/contact').send(validContact).expect(201)
    const res = await request(app).post('/api/contact').send(validContact)

    expect(res.status).toBe(429)
    expect(res.body.error.code).toBe('RATE_LIMITED')
    expect(res.headers['retry-after']).toBeDefined()
    expect(res.headers['ratelimit-policy']).toContain('q=2')
  })

  it('applies a general limit to every API endpoint', async () => {
    const config = createTestConfig({ RATE_LIMIT_MAX: '3' })
    const { app } = buildTestApp({ config })

    for (let i = 0; i < 3; i++) {
      await request(app).get('/api/services').expect(200)
    }
    const res = await request(app).get('/api/profile')
    expect(res.status).toBe(429)
    expect(res.body.error.code).toBe('RATE_LIMITED')
  })

  it('keeps separate counters for different client IPs behind a trusted proxy', async () => {
    const config = createTestConfig({ RATE_LIMIT_MAX: '1', TRUST_PROXY: '1' })
    const { app } = buildTestApp({ config })

    await request(app).get('/api/services').set('X-Forwarded-For', '203.0.113.1').expect(200)
    await request(app).get('/api/services').set('X-Forwarded-For', '203.0.113.2').expect(200)
    await request(app).get('/api/services').set('X-Forwarded-For', '203.0.113.1').expect(429)
  })
})
