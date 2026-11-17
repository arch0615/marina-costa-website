import { vi } from 'vitest'
import { portfolioFixture, profileFixture, servicesFixture, testimonialsFixture } from './fixtures'

type Handler = (
  init: RequestInit | undefined,
) => { status: number; body: unknown } | Promise<{ status: number; body: unknown }>

const json = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response

/**
 * Stubs `fetch` with an in-memory API. Unknown routes return 404.
 * Pass `overrides` to change specific endpoints (keyed by "METHOD /path").
 */
export function mockApi(overrides: Record<string, Handler> = {}) {
  const routes: Record<string, Handler> = {
    'GET /api/profile': () => ({ status: 200, body: { data: profileFixture } }),
    'GET /api/services': () => ({ status: 200, body: { data: servicesFixture } }),
    'GET /api/portfolio': () => ({ status: 200, body: { data: portfolioFixture } }),
    'GET /api/testimonials': () => ({ status: 200, body: { data: testimonialsFixture } }),
    'POST /api/contact': () => ({ status: 201, body: { data: { message: 'Thanks!' } } }),
    ...overrides,
  }

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost')
    const key = `${init?.method ?? 'GET'} ${url.pathname}`
    const handler = routes[key]
    if (!handler) return json(404, { error: { code: 'NOT_FOUND', message: 'Not found' } })
    const { status, body } = await handler(init)
    return json(status, body)
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Returns the parsed JSON bodies sent to an endpoint. */
export function requestBodies(fetchMock: ReturnType<typeof mockApi>, method: string, path: string) {
  return fetchMock.mock.calls
    .filter(([input, init]) => (init?.method ?? 'GET') === method && String(input).endsWith(path))
    .map(([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>)
}
