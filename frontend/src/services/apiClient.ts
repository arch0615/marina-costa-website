import type { ApiErrorBody, ApiErrorCode, FieldErrors } from '@/types'
import { API_BASE_URL } from '@/utils/siteConfig'

export type ClientErrorCode = ApiErrorCode | 'NETWORK_ERROR'

/** Error thrown for failed API calls, carrying the server's code and field errors. */
export class ApiError extends Error {
  readonly status: number
  readonly code: ClientErrorCode
  readonly details: FieldErrors | undefined

  constructor(status: number, code: ClientErrorCode, message: string, details?: FieldErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const NETWORK_MESSAGE = 'We could not reach the server. Please check your connection and try again.'

function isErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorBody).error?.message === 'string'
  )
}

/** Performs a JSON request against the API and unwraps the `{ data }` envelope. */
export async function apiRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const { method = 'GET', body, signal } = options
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...(signal ? { signal } : {}),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'NETWORK_ERROR', NETWORK_MESSAGE)
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (isErrorBody(payload)) {
      const { code, message, details } = payload.error
      throw new ApiError(response.status, code, message, details)
    }
    throw new ApiError(
      response.status,
      response.status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
      'Something went wrong. Please try again later.',
    )
  }

  return (payload as { data: T }).data
}
