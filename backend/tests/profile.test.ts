import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { buildTestApp, getTestDb, resetDatabase } from './helpers.js'

describe('GET /api/profile', () => {
  beforeEach(() => resetDatabase())

  it('returns the profile with social links, experience and qualifications', async () => {
    const { app } = buildTestApp()
    const res = await request(app).get('/api/profile')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(res.headers['cache-control']).toContain('max-age=60')

    const profile = res.body.data
    expect(profile).toMatchObject({
      fullName: 'Marina Costa',
      professionalTitle: 'Brand & Digital Product Designer',
      companyName: 'Costa Studio',
      email: 'marina@example.com',
      website: 'https://card.example.com',
    })
    expect(profile.skills.length).toBeGreaterThan(0)
    expect(profile.socialLinks.map((l: { platform: string }) => l.platform)).toEqual([
      'LINKEDIN',
      'INSTAGRAM',
      'X',
      'YOUTUBE',
    ])
    expect(profile.experience[0]).toMatchObject({
      organization: 'Costa Studio',
      startDate: '2019-03-01',
      endDate: null,
    })
    expect(profile.qualifications).toHaveLength(3)
    // Internal columns are never exposed.
    expect(profile).not.toHaveProperty('slug')
    expect(profile.socialLinks[0]).not.toHaveProperty('isActive')
  })

  it('omits inactive social links', async () => {
    await getTestDb().socialLink.updateMany({
      where: { platform: 'INSTAGRAM' },
      data: { isActive: false },
    })
    const { app } = buildTestApp()
    const res = await request(app).get('/api/profile')

    const platforms = res.body.data.socialLinks.map((l: { platform: string }) => l.platform)
    expect(platforms).not.toContain('INSTAGRAM')
    expect(platforms).toContain('LINKEDIN')
  })

  it('returns 404 when no profile has been configured', async () => {
    await getTestDb().profile.deleteMany()
    const { app } = buildTestApp()
    const res = await request(app).get('/api/profile')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
