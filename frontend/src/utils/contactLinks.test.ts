import { describe, expect, it } from 'vitest'
import { profileFixture } from '@/test/fixtures'
import { buildContactActions } from './contactActions'
import {
  emailHref,
  mapsHref,
  phoneHref,
  safeExternalUrl,
  whatsappHref,
  whatsappShareHref,
} from './contactLinks'

describe('contact links', () => {
  it('builds tel: links in international format', () => {
    expect(phoneHref('+1 (212) 555-0148')).toBe('tel:+12125550148')
    expect(phoneHref('212 555 0148')).toBe('tel:2125550148')
  })

  it('builds mailto: links with encoded subject and body', () => {
    expect(emailHref('marina@example.com')).toBe('mailto:marina@example.com')
    expect(emailHref('marina@example.com', { subject: 'Hi & hello', body: 'Line 1\nLine 2' })).toBe(
      'mailto:marina@example.com?subject=Hi%20%26%20hello&body=Line%201%0ALine%202',
    )
  })

  it('builds WhatsApp chat and share links', () => {
    expect(whatsappHref('+1 212 555 0148')).toBe('https://wa.me/12125550148')
    expect(whatsappHref('+1 212 555 0148', 'Hi there!')).toBe(
      'https://wa.me/12125550148?text=Hi%20there!',
    )
    expect(whatsappShareHref('Card: https://x.example/card')).toBe(
      'https://wa.me/?text=Card%3A%20https%3A%2F%2Fx.example%2Fcard',
    )
  })

  it('builds map search links', () => {
    expect(mapsHref('New York, NY')).toBe(
      'https://www.google.com/maps/search/?api=1&query=New%20York%2C%20NY',
    )
  })

  it('only allows http(s) URLs', () => {
    expect(safeExternalUrl('https://example.com/a')).toBe('https://example.com/a')
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(safeExternalUrl('not a url')).toBeNull()
    expect(safeExternalUrl(null)).toBeNull()
  })
})

describe('buildContactActions', () => {
  it('returns call, email, WhatsApp and website actions', () => {
    const actions = buildContactActions(profileFixture)
    expect(actions.map((a) => [a.key, a.href])).toEqual([
      ['call', 'tel:+12125550148'],
      ['email', 'mailto:marina@example.com'],
      ['whatsapp', expect.stringMatching(/^https:\/\/wa\.me\/12125550148\?text=/)],
      ['website', 'https://costa.example/'],
    ])
  })

  it('omits channels that are not configured', () => {
    const actions = buildContactActions({
      ...profileFixture,
      phone: null,
      whatsapp: null,
      website: null,
    })
    expect(actions.map((a) => a.key)).toEqual(['email'])
  })
})
