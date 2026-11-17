import { expect, test } from '@playwright/test'
import { BASE_URL, horizontalOverflow, trackConsoleErrors } from './helpers.js'

test.describe('presentation page', () => {
  test('opens with the profile, all sections and no console errors', async ({ page }) => {
    const errors = trackConsoleErrors(page)
    await page.goto('/')

    await expect(page).toHaveTitle('Marina Costa — Brand & Digital Product Designer')
    await expect(page.getByRole('heading', { level: 1, name: 'Marina Costa' })).toBeVisible()
    for (const id of ['about', 'services', 'portfolio', 'testimonials', 'contact']) {
      await expect(page.locator(`section#${id}`)).toBeAttached()
    }
    await expect(page.getByRole('img', { name: 'Portrait of Marina Costa' })).toBeVisible()
    await page.locator('#contact').scrollIntoViewIfNeeded()
    await expect(page.getByRole('form', { name: 'Contact form' })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('navigates between sections from the header', async ({ page, isMobile }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    for (const [label, id] of [
      ['About', 'about'],
      ['Services', 'services'],
      ['Portfolio', 'portfolio'],
      ['Contact', 'contact'],
    ] as const) {
      if (isMobile) {
        await page.getByRole('button', { name: 'Open menu' }).click()
        await page.getByRole('dialog').getByRole('link', { name: label, exact: true }).click()
        await expect(page.getByRole('dialog')).toBeHidden()
      } else {
        await page
          .getByRole('navigation', { name: 'Primary' })
          .getByRole('link', { name: label })
          .click()
      }
      await expect(page).toHaveURL(`${BASE_URL}/#${id}`)
      await expect(page.locator(`#${id}`)).toBeInViewport({ ratio: 0.1 })
    }
  })

  test('hero calls to action lead to contact and portfolio', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'View portfolio' }).click()
    await expect(page.locator('#portfolio')).toBeInViewport({ ratio: 0.1 })

    await page.goto('/')
    await page.getByRole('main').getByRole('link', { name: 'Contact me' }).click()
    await expect(page.locator('#contact')).toBeInViewport({ ratio: 0.1 })
  })

  test('filters portfolio projects by category', async ({ page }) => {
    await page.goto('/#portfolio')
    const projects = page.locator('#portfolio article')
    await expect(projects).toHaveCount(6)

    await page.getByRole('button', { name: 'Branding', exact: true }).click()
    await expect(projects).toHaveCount(2)
    await expect(page.getByRole('button', { name: 'Branding', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await page.getByRole('button', { name: 'All', exact: true }).click()
    await expect(projects).toHaveCount(6)
  })

  test('links to external projects open safely in a new tab', async ({ page }) => {
    await page.goto('/#portfolio')
    const link = page.locator('#portfolio article a').first()
    await expect(link).toHaveAttribute('href', /^https:\/\//)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

test.describe('responsive layout', () => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      for (const path of ['/', '/card']) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        expect(await horizontalOverflow(page), `${path} at ${width}px`).toBeLessThanOrEqual(0)
      }
    })
  }
})

test.describe('SEO', () => {
  test('server-rendered metadata, robots.txt and sitemap.xml', async ({ request }) => {
    const home = await (await request.get('/')).text()
    expect(home).toContain('<title>Marina Costa — Brand &amp; Digital Product Designer</title>')
    expect(home).toContain(`<link rel="canonical" href="${BASE_URL}/" />`)
    expect(home).toContain('property="og:image"')
    expect(home).toContain('"@type":"Person"')

    const card = await (await request.get('/card')).text()
    expect(card).toContain('<title>Marina Costa · Digital Business Card</title>')
    expect(card).toContain(`<link rel="canonical" href="${BASE_URL}/card" />`)

    const missing = await request.get('/no-such-page')
    expect(missing.status()).toBe(404)
    expect(await missing.text()).toContain('noindex')

    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain(`Sitemap: ${BASE_URL}/sitemap.xml`)
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain(`<loc>${BASE_URL}/card</loc>`)
  })

  test('sends security headers', async ({ request }) => {
    const response = await request.get('/')
    expect(response.headers()['content-security-policy']).toContain("default-src 'self'")
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
  })
})
