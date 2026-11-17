import { expect, test } from '@playwright/test'
import { BASE_URL, decodeQrPng, readDownload, trackConsoleErrors, vcardLines } from './helpers.js'

test.describe('digital business card', () => {
  test('opens from the website and shows the profile', async ({ page, isMobile }) => {
    const errors = trackConsoleErrors(page)
    await page.goto('/')
    if (isMobile) {
      await page.getByRole('button', { name: 'Open menu' }).click()
      await page.getByRole('dialog').getByRole('link', { name: 'Digital card' }).click()
    } else {
      await page.getByRole('banner').getByRole('link', { name: 'Digital card' }).click()
    }

    await expect(page).toHaveURL(`${BASE_URL}/card`)
    await expect(page).toHaveTitle('Marina Costa · Digital Business Card')
    await expect(page.getByRole('heading', { level: 1, name: 'Marina Costa' })).toBeVisible()
    await expect(page.getByText('Costa Studio').first()).toBeVisible()
    expect(errors).toEqual([])
  })

  test('contact actions point to the right destinations', async ({ page }) => {
    await page.goto('/card')
    const actions = page.getByRole('navigation', { name: 'Contact actions' })

    await expect(actions.getByRole('link', { name: 'Call Marina Costa' })).toHaveAttribute(
      'href',
      'tel:+12125550148',
    )
    await expect(actions.getByRole('link', { name: 'Email Marina Costa' })).toHaveAttribute(
      'href',
      'mailto:marina@example.com',
    )
    await expect(actions.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\/12125550148\?text=/,
    )
    await expect(actions.getByRole('link', { name: /website/ })).toHaveAttribute(
      'href',
      `${BASE_URL}/`,
    )
    await expect(actions.getByRole('link', { name: /in maps/ })).toHaveAttribute(
      'href',
      /google\.com\/maps\/search\/\?api=1&query=New%20York/,
    )
  })

  test('shows only configured social networks', async ({ page }) => {
    await page.goto('/card')
    const social = page.getByRole('main').getByRole('list', { name: 'Social media' })
    await expect(social.getByRole('link')).toHaveCount(4)
    await expect(social.getByRole('link', { name: /Facebook/ })).toHaveCount(0)
  })

  test('downloads a valid vCard with the contact details', async ({ page }) => {
    await page.goto('/card')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Save contact' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('marina-costa.vcf')

    const text = (await readDownload(download)).toString('utf8')
    expect(text.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true)
    expect(vcardLines(text)).toEqual(
      expect.arrayContaining([
        'FN:Marina Costa',
        'N:Costa;Marina;;;',
        'ORG:Costa Studio',
        'TITLE:Brand & Digital Product Designer',
        'TEL;TYPE=CELL,VOICE:+12125550148',
        'EMAIL;TYPE=INTERNET,PREF:marina@example.com',
        `URL:${BASE_URL}`,
        `item2.URL:${BASE_URL}/card`,
        'END:VCARD',
      ]),
    )
  })

  test('QR code resolves to the permanent card URL', async ({ page }) => {
    await page.goto('/card')
    await expect(page.getByTestId('qr-code')).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download PNG' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('marina-costa-card-qr.png')

    const decoded = decodeQrPng(await readDownload(download))
    expect(decoded).toBe(`${BASE_URL}/card`)

    // The encoded destination is a working page.
    await page.goto(decoded ?? '')
    await expect(page.getByRole('heading', { level: 1, name: 'Marina Costa' })).toBeVisible()
  })

  test('QR code can also be downloaded as SVG', async ({ page }) => {
    await page.goto('/card')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download SVG' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('marina-costa-card-qr.svg')
    expect((await readDownload(download)).toString('utf8')).toContain('<svg')
  })

  test('uses the native share sheet when available', async ({ page }) => {
    await page.addInitScript(() => {
      const calls: unknown[] = []
      Object.assign(window, { __shareCalls: calls })
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: (data: unknown) => {
          calls.push(data)
          return Promise.resolve()
        },
      })
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    })
    await page.goto('/card')
    await page.getByRole('button', { name: 'Share' }).click()

    const calls = await page.evaluate(
      () => (window as unknown as { __shareCalls: unknown[] }).__shareCalls,
    )
    expect(calls).toEqual([
      {
        title: 'Marina Costa · Digital Business Card',
        text: 'Marina Costa — Brand & Digital Product Designer',
        url: `${BASE_URL}/card`,
      },
    ])
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('falls back to copy link, WhatsApp and email sharing', async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions are Chromium-specific')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    })
    await page.goto('/card')
    await page.getByRole('button', { name: 'Share' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Link')).toHaveValue(`${BASE_URL}/card`)
    await expect(dialog.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      `https://wa.me/?text=${encodeURIComponent(`Marina Costa — Brand & Digital Product Designer ${BASE_URL}/card`)}`,
    )
    await expect(dialog.getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      /^mailto:\?subject=Marina%20Costa/,
    )

    await dialog.getByRole('button', { name: 'Copy' }).click()
    await expect(dialog.getByRole('button', { name: 'Copied' })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${BASE_URL}/card`)
  })

  test('links back to the full portfolio section', async ({ page }) => {
    await page.goto('/card')
    await page.getByRole('link', { name: 'Full portfolio' }).click()
    await expect(page).toHaveURL(`${BASE_URL}/#portfolio`)
    await expect(page.locator('#portfolio')).toBeInViewport({ ratio: 0.1 })
  })
})
