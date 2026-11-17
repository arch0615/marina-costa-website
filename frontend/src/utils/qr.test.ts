// @vitest-environment node
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import { describe, expect, it } from 'vitest'
import { createQrPngDataUrl, createQrSvg } from './qr'

function decodePngDataUrl(dataUrl: string): string | null {
  const png = PNG.sync.read(Buffer.from(dataUrl.split(',')[1] ?? '', 'base64'))
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? null
}

describe('QR code generation', () => {
  const cardUrl = 'https://www.example.com/card'

  it('encodes the permanent card URL in a scannable PNG', async () => {
    const dataUrl = await createQrPngDataUrl(cardUrl, 512)
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
    expect(decodePngDataUrl(dataUrl)).toBe(cardUrl)
  })

  it('produces an SVG version for print', async () => {
    const svg = await createQrSvg(cardUrl)
    expect(svg).toContain('<svg')
    expect(svg).toContain('#15171c')
  })
})
