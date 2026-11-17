import type { Response } from 'express'
import type { ApiSuccess } from '@presence/shared'

/** Sends a successful JSON response using the `{ data }` envelope. */
export function sendData<T>(
  res: Response,
  data: T,
  options: { status?: number; cache?: string } = {},
) {
  res.set('Cache-Control', options.cache ?? 'no-store')
  const body: ApiSuccess<T> = { data }
  res.status(options.status ?? 200).json(body)
}
