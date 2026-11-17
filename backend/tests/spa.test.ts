import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildTestApp, createTestConfig, getTestDb, resetDatabase } from './helpers.js'

const TEMPLATE = `<!doctype html><html><head>
    <!--seo:start--><title>Default title</title><!--seo:end-->
  </head><body><div id="root"></div></body></html>`

describe('frontend serving with route metadata', () => {
  let distDir: string

  beforeAll(() => {
    distDir = mkdtempSync(path.join(tmpdir(), 'presence-dist-'))
    writeFileSync(path.join(distDir, 'index.html'), TEMPLATE)
    mkdirSync(path.join(distDir, 'assets'))
    writeFileSync(path.join(distDir, 'assets', 'index-abc123.js'), 'console.log(1)')
    writeFileSync(path.join(distDir, 'robots.txt'), 'User-agent: *')
  })
  afterAll(() => rmSync(distDir, { recursive: true, force: true }))
  beforeEach(() => resetDatabase())

  const app = () => buildTestApp({ config: createTestConfig({ FRONTEND_DIST_DIR: distDir }) }).app

  it('injects profile metadata for the home page', async () => {
    const res = await request(app()).get('/')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/html/)
    expect(res.text).toContain('<title>Marina Costa — Brand &amp; Digital Product Designer</title>')
    expect(res.text).toContain('<link rel="canonical" href="https://card.example.com/" />')
    expect(res.text).toContain(
      'property="og:image" content="https://card.example.com/og-image.png"',
    )
    expect(res.text).toContain('"@type":"Person"')
    expect(res.text).not.toContain('Default title')
  })

  it('injects card-specific metadata for /card', async () => {
    const res = await request(app()).get('/card')

    expect(res.status).toBe(200)
    expect(res.text).toContain('<title>Marina Costa · Digital Business Card</title>')
    expect(res.text).toContain('<link rel="canonical" href="https://card.example.com/card" />')
  })

  it('returns 404 with noindex for unknown pages', async () => {
    const res = await request(app()).get('/missing-page')

    expect(res.status).toBe(404)
    expect(res.text).toContain('<meta name="robots" content="noindex" />')
  })

  it('escapes profile data to prevent HTML/script injection', async () => {
    await getTestDb().profile.updateMany({
      data: { fullName: '</script><script>alert(1)</script>' },
    })
    const res = await request(app()).get('/')

    expect(res.text).not.toContain('<script>alert(1)</script>')
    expect(res.text).toContain('&lt;/script&gt;')
    expect(res.text).toContain('\\u003c/script\\u003e')
  })

  it('serves hashed assets with immutable caching', async () => {
    const res = await request(app()).get('/assets/index-abc123.js')

    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toContain('immutable')
  })

  it('serves static files and keeps API routes separate', async () => {
    await request(app()).get('/robots.txt').expect(200)
    const res = await request(app()).get('/api/unknown')
    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toMatch(/application\/json/)
  })
})
