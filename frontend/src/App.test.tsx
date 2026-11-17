import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '@/test/api-mock'
import { renderRoute } from '@/test/render'

describe('navigation and routing', () => {
  it('renders the presentation page with section navigation', async () => {
    mockApi()
    renderRoute('/')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Marina Costa' }),
    ).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['About', '/#about'],
      ['Services', '/#services'],
      ['Portfolio', '/#portfolio'],
      ['Contact', '/#contact'],
    ])
    for (const id of ['about', 'services', 'portfolio', 'testimonials', 'contact']) {
      expect(document.getElementById(id)).not.toBeNull()
    }
    expect(screen.getByRole('link', { name: /digital card/i })).toHaveAttribute('href', '/card')
  })

  it('opens and closes the mobile menu', async () => {
    mockApi()
    const { user } = renderRoute('/')

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const dialog = await screen.findByRole('dialog')
    const mobileNav = within(dialog).getByRole('navigation', { name: 'Mobile' })
    expect(within(mobileNav).getByRole('link', { name: 'Portfolio' })).toHaveAttribute(
      'href',
      '/#portfolio',
    )

    await user.click(within(mobileNav).getByRole('link', { name: 'Portfolio' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('navigates from the header to the digital card', async () => {
    mockApi()
    const { user } = renderRoute('/')

    await user.click(await screen.findByRole('link', { name: /digital card/i }))
    expect(await screen.findByRole('button', { name: /share/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /save contact/i })).toBeInTheDocument()
  })

  it('renders the 404 page for unknown routes', async () => {
    mockApi()
    renderRoute('/does-not-exist')

    expect(await screen.findByRole('heading', { name: /doesn't exist/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to homepage' })).toHaveAttribute('href', '/')
  })

  it('shows an error with retry when content fails to load', async () => {
    let failing = true
    mockApi({
      'GET /api/services': () =>
        failing
          ? { status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'Boom' } } }
          : {
              status: 200,
              body: {
                data: [{ id: 'x', title: 'Recovered service', description: 'd', icon: 'palette' }],
              },
            },
    })
    const { user } = renderRoute('/')

    const alert = await screen.findByText('Services could not be loaded.')
    failing = false
    await user.click(
      within(alert.closest('[role="alert"]') as HTMLElement).getByRole('button', {
        name: /try again/i,
      }),
    )
    expect(await screen.findByText('Recovered service')).toBeInTheDocument()
  })

  it('pre-fills the contact subject from a service card', async () => {
    mockApi()
    const { user } = renderRoute('/')

    await user.click(await screen.findByRole('link', { name: 'Discuss Brand Identity' }))
    expect(screen.getByLabelText('Subject')).toHaveValue('Enquiry: Brand Identity')
  })
})
