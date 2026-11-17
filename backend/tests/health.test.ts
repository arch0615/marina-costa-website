import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { createDatabase } from '../src/config/database.js'
import { buildTestApp } from './helpers.js'

describe('GET /api/health', () => {
  it('reports ok when the database is reachable', async () => {
    const { app } = buildTestApp()
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.body.data).toMatchObject({ status: 'ok', database: 'up' })
    expect(typeof res.body.data.uptimeSeconds).toBe('number')
    expect(Date.parse(res.body.data.timestamp)).not.toBeNaN()
  })

  const unreachableDb = createDatabase('postgresql://nobody:nothing@127.0.0.1:1/missing')
  afterAll(() => unreachableDb.$disconnect())

  it('reports degraded with 503 when the database is down', async () => {
    const { app } = buildTestApp({ db: unreachableDb })
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(503)
    expect(res.body.data).toMatchObject({ status: 'degraded', database: 'down' })
  })
})
