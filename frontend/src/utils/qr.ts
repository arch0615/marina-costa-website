import type { QRCodeRenderersOptions } from 'qrcode'

/** Shared QR settings: medium error correction and a quiet zone for reliable scanning. */
export const QR_OPTIONS = {
  errorCorrectionLevel: 'M',
  margin: 2,
  color: { dark: '#15171c', light: '#ffffff' },
} as const satisfies QRCodeRenderersOptions & { errorCorrectionLevel: 'M' }

// The QR library is loaded on demand so it only ships with the card page.
const loadQrCode = () => import('qrcode')

export async function createQrSvg(text: string): Promise<string> {
  const QRCode = await loadQrCode()
  return QRCode.toString(text, { ...QR_OPTIONS, type: 'svg' })
}

export async function createQrPngDataUrl(text: string, width = 1024): Promise<string> {
  const QRCode = await loadQrCode()
  return QRCode.toDataURL(text, { ...QR_OPTIONS, width, type: 'image/png' })
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
