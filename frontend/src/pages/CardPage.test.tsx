import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi } from '@/test/api-mock'
import { profileFixture } from '@/test/fixtures'
import { renderRoute } from '@/test/render'
import { getCardUrl } from '@/utils/siteConfig'

describe('digital business card', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows the profile header', async () => {
    mockApi()
    renderRoute('/card')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Marina Costa' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Brand & Digital Product Designer')).toBeInTheDocument()
    expect(screen.getByText('Costa Studio')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Portrait of Marina Costa' })).toHaveAttribute(
      'src',
      '/images/profile/marina-costa.webp',
    )
  })

  it('renders contact actions that open the right applications', async () => {
    mockApi()
    renderRoute('/card')

    const actions = await screen.findByRole('navigation', { name: 'Contact actions' })
    expect(within(actions).getByRole('link', { name: 'Call Marina Costa' })).toHaveAttribute(
      'href',
      'tel:+12125550148',
    )
    expect(within(actions).getByRole('link', { name: 'Email Marina Costa' })).toHaveAttribute(
      'href',
      'mailto:marina@example.com',
    )
    const whatsapp = within(actions).getByRole('link', { name: /whatsapp/i })
    expect(whatsapp.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/12125550148\?text=/)
    expect(whatsapp).toHaveAttribute('target', '_blank')
    expect(whatsapp).toHaveAttribute('rel', 'noopener noreferrer')
    expect(within(actions).getByRole('link', { name: /website/i })).toHaveAttribute(
      'href',
      'https://costa.example/',
    )
    expect(
      within(actions)
        .getByRole('link', { name: /in maps/i })
        .getAttribute('href'),
    ).toContain('google.com/maps/search')
  })

  it('hides actions for channels that are not configured', async () => {
    mockApi({
      'GET /api/profile': () => ({
        status: 200,
        body: { data: { ...profileFixture, whatsapp: null, location: null } },
      }),
    })
    renderRoute('/card')

    const actions = await screen.findByRole('navigation', { name: 'Contact actions' })
    expect(within(actions).queryByRole('link', { name: /whatsapp/i })).not.toBeInTheDocument()
    expect(within(actions).queryByRole('link', { name: /maps/i })).not.toBeInTheDocument()
  })

  it('offers the vCard download', async () => {
    mockApi()
    renderRoute('/card')

    const save = await screen.findByRole('link', { name: /save contact/i })
    expect(save).toHaveAttribute('href', '/api/vcard')
    expect(save).toHaveAttribute('download', 'marina-costa.vcf')
  })

  it('shows only configured social networks', async () => {
    mockApi()
    renderRoute('/card')

    const social = await screen.findByRole('list', { name: 'Social media' })
    const labels = within(social)
      .getAllByRole('link')
      .map((link) => link.getAttribute('aria-label'))
    expect(labels).toEqual([
      'Marina Costa on LinkedIn (opens in a new tab)',
      'Marina Costa on Instagram (opens in a new tab)',
    ])
  })

  it('lists featured projects and links to the full portfolio', async () => {
    mockApi()
    renderRoute('/card')

    expect(await screen.findByText('Lumen Bank')).toBeInTheDocument()
    expect(screen.queryByText('Atlas Logistics')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /full portfolio/i })).toHaveAttribute(
      'href',
      '/#portfolio',
    )
  })

  it('renders a QR code for the permanent card URL and downloads it as SVG', async () => {
    mockApi()
    const clicks: { download: string; href: string }[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push({ download: this.download, href: this.href })
    })
    URL.createObjectURL = vi.fn(() => 'blob:qr')
    URL.revokeObjectURL = vi.fn()
    const { user } = renderRoute('/card')

    const qr = await screen.findByTestId('qr-code')
    expect(qr).toHaveAttribute('alt', `QR code that opens ${getCardUrl()}`)
    expect(qr.getAttribute('src')).toMatch(/^data:image\/svg\+xml/)

    await user.click(screen.getByRole('button', { name: /download svg/i }))
    expect(clicks).toEqual([{ download: 'marina-costa-card-qr.svg', href: 'blob:qr' }])
  })
})
