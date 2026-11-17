import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildTestApp, getTestDb, resetDatabase } from './helpers.js'

describe('content endpoints', () => {
  beforeAll(async () => {
    await resetDatabase()
    const db = getTestDb()
    await db.service.updateMany({ where: { title: 'Design Workshops' }, data: { isActive: false } })
    await db.portfolioItem.updateMany({
      where: { title: 'Nord Coffee' },
      data: { isActive: false },
    })
  })

  it('GET /api/services returns active services in display order', async () => {
    const { app } = buildTestApp()
    const res = await request(app).get('/api/services')

    expect(res.status).toBe(200)
    const titles = res.body.data.map((s: { title: string }) => s.title)
    expect(titles[0]).toBe('Brand Identity')
    expect(titles).not.toContain('Design Workshops')
    expect(res.body.data[0]).toEqual({
      id: expect.any(String),
      title: 'Brand Identity',
      description: expect.any(String),
      icon: 'palette',
    })
  })

  it('GET /api/portfolio returns active projects with technologies and featured flag', async () => {
    const { app } = buildTestApp()
    const res = await request(app).get('/api/portfolio')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(5)
    expect(res.body.data.map((p: { title: string }) => p.title)).not.toContain('Nord Coffee')
    expect(res.body.data[0]).toMatchObject({
      title: 'Lumen Bank',
      category: 'Product Design',
      isFeatured: true,
      technologies: expect.arrayContaining(['Figma']),
      projectUrl: expect.stringMatching(/^https:\/\//),
    })
  })

  it('GET /api/testimonials returns testimonials', async () => {
    const { app } = buildTestApp()
    const res = await request(app).get('/api/testimonials')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(3)
    expect(res.body.data[0]).toHaveProperty('quote')
    expect(res.body.data[0]).toHaveProperty('authorName')
  })
})
