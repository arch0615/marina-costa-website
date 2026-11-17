import { readFile } from 'node:fs/promises'
import type { Download, Page } from '@playwright/test'
import jsQRModule from 'jsqr'
import pg from 'pg'
import { PNG } from 'pngjs'
import { BASE_URL, TEST_DATABASE_URL } from '../env.js'

// jsqr's CommonJS typings don't match Node's ESM interop: at runtime the default import is the function.
const jsQR = jsQRModule as unknown as typeof jsQRModule.default

export { BASE_URL }

export async function readDownload(download: Download): Promise<Buffer> {
  const filePath = await download.path()
  return readFile(filePath)
}

export function decodeQrPng(buffer: Buffer): string | null {
  const png = PNG.sync.read(buffer)
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? null
}

/** Unfolds a vCard (RFC 2425) into logical lines. */
export function vcardLines(text: string): string[] {
  return text
    .replace(/\r\n[ \t]/g, '')
    .split('\r\n')
    .filter(Boolean)
}

export async function findSubmissionsBySubject(subject: string) {
  const client = new pg.Client({ connectionString: TEST_DATABASE_URL })
  await client.connect()
  try {
    const result = await client.query<{
      name: string
      email: string
      status: string
      message: string
    }>('SELECT name, email, status, message FROM contact_submissions WHERE subject = $1', [subject])
    return result.rows
  } finally {
    await client.end()
  }
}

/** Collects console errors and uncaught exceptions for the lifetime of a page. */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}
