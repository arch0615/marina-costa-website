import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildVCard, escapeText, foldLine, splitName, vCardFileName } from '../src/utils/vcard.js'
import { buildTestApp, resetDatabase } from './helpers.js'

/** Unfolds a vCard per RFC 2425 and returns its logical lines. */
function unfold(vcard: string): string[] {
  return vcard
    .replace(/\r\n[ \t]/g, '')
    .split('\r\n')
    .filter(Boolean)
}

describe('vCard generator', () => {
  const base = {
    fullName: 'Marina Costa',
    email: 'marina@example.com',
    revision: new Date('2026-01-02T03:04:05Z'),
  }

  it('produces a valid vCard 3.0 envelope with CRLF line endings', () => {
    const vcard = buildVCard(base)
    expect(vcard.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true)
    expect(vcard.endsWith('END:VCARD\r\n')).toBe(true)
    expect(vcard.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })

  it('includes all contact fields', () => {
    const lines = unfold(
      buildVCard({
        ...base,
        organization: 'Costa Studio',
        title: 'Designer',
        phone: '+1 (212) 555-0148',
        whatsapp: '+1 212 555 0199',
        website: 'https://costa.example',
        cardUrl: 'https://costa.example/card',
        location: 'New York, NY',
        socialProfiles: [{ type: 'LINKEDIN', url: 'https://www.linkedin.com/in/someone' }],
      }),
    )

    expect(lines).toEqual(
      expect.arrayContaining([
        'N:Costa;Marina;;;',
        'FN:Marina Costa',
        'ORG:Costa Studio',
        'TITLE:Designer',
        'TEL;TYPE=CELL,VOICE:+12125550148',
        'item1.TEL;TYPE=CELL:+12125550199',
        'item1.X-ABLabel:WhatsApp',
        'EMAIL;TYPE=INTERNET,PREF:marina@example.com',
        'URL:https://costa.example',
        'item2.URL:https://costa.example/card',
        'ADR;TYPE=WORK:;;;New York\\, NY;;;',
        'X-SOCIALPROFILE;TYPE=linkedin:https://www.linkedin.com/in/someone',
        'REV:2026-01-02T03:04:05Z',
      ]),
    )
  })

  it('does not duplicate WhatsApp when it equals the phone number', () => {
    const vcard = buildVCard({ ...base, phone: '+1 212 555 0148', whatsapp: '+12125550148' })
    expect(vcard).not.toContain('WhatsApp')
  })

  it('escapes special characters in text values', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe(String.raw`a\,b\;c\\d\ne`)
    const lines = unfold(buildVCard({ ...base, organization: 'Smith; Jones, Partners' }))
    expect(lines).toContain(String.raw`ORG:Smith\; Jones\, Partners`)
  })

  it('folds long lines at 75 octets without splitting multi-byte characters', () => {
    const long = `NOTE:${'é'.repeat(80)}`
    const folded = foldLine(long)
    for (const physical of folded.split('\r\n')) {
      expect(Buffer.byteLength(physical, 'utf8')).toBeLessThanOrEqual(75)
    }
    expect(folded.replace(/\r\n /g, '')).toBe(long)
  })

  it('splits names and builds safe file names', () => {
    expect(splitName('Ana Maria de Souza')).toEqual({ given: 'Ana Maria de', family: 'Souza' })
    expect(splitName('Cher')).toEqual({ given: 'Cher', family: '' })
    expect(vCardFileName('João Pérez')).toBe('joao-perez.vcf')
    expect(vCardFileName('***')).toBe('contact.vcf')
  })
})

describe('GET /api/vcard', () => {
  beforeAll(() => resetDatabase())

  it('downloads the profile as a vCard attachment', async () => {
    const { app } = buildTestApp()
    const res = await request(app).get('/api/vcard')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('text/vcard; charset=utf-8')
    expect(res.headers['content-disposition']).toBe('attachment; filename="marina-costa.vcf"')

    const lines = unfold(res.text)
    expect(lines).toEqual(
      expect.arrayContaining([
        'FN:Marina Costa',
        'ORG:Costa Studio',
        'TITLE:Brand & Digital Product Designer',
        'TEL;TYPE=CELL,VOICE:+12125550148',
        'EMAIL;TYPE=INTERNET,PREF:marina@example.com',
        'URL:https://card.example.com',
        'item2.URL:https://card.example.com/card',
      ]),
    )
  })
})
