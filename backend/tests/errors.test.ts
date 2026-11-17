import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createDatabase, type Database } from '../src/config/database.js'
import { buildTestApp, getTestDb, resetDatabase } from './helpers.js'

describe('error handling', () => {
  beforeAll(() => resetDatabase())

  it('returns a JSON 404 for unknown API routes', async () => {
    const { app } = buildTestApp()
    const res = await request(app).get('/api/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'No endpoint matches GET /api/does-not-exist.',
        requestId: expect.any(String),
      },
    })
  })

  it('hides internal error details and stack traces', async () => {
    const realDb = getTestDb()
    const failingDb = new Proxy(realDb, {
      get(target, prop, receiver) {
        if (prop === 'profile') {
          return {
            findUnique: () => Promise.reject(new Error('relation "secret_table" does not exist')),
          }
        }
        return Reflect.get(target, prop, receiver)
      },
    }) as Database

    const { app } = buildTestApp({ db: failingDb })
    const res = await request(app).get('/api/profile')

    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe('INTERNAL_ERROR')
    expect(res.body.error.message).toBe('Something went wrong. Please try again later.')
    const raw = JSON.stringify(res.body)
    expect(raw).not.toContain('secret_table')
    expect(raw).not.toMatch(/at .*\.ts:\d+/)
    expect(res.body.error).not.toHaveProperty('stack')
  })

  const unreachableDb = createDatabase('postgresql://nobody:nothing@127.0.0.1:1/missing')
  afterAll(() => unreachableDb.$disconnect())

  it('responds 503 when the database is unavailable', async () => {
    const { app } = buildTestApp({ db: unreachableDb })
    const res = await request(app).get('/api/services')

    expect(res.status).toBe(503)
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE')
  })

  it('echoes a valid incoming request id', async () => {
    const { app } = buildTestApp()
    const res = await request(app).get('/api/nope').set('X-Request-Id', 'trace-12345678')

    expect(res.headers['x-request-id']).toBe('trace-12345678')
    expect(res.body.error.requestId).toBe('trace-12345678')
  })
})
