import { useCallback, useEffect, useState } from 'react'
import type { AsyncState } from '@/types'

const resolved = new Map<string, unknown>()
const inflight = new Map<string, Promise<unknown>>()

function load<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (resolved.has(key)) return Promise.resolve(resolved.get(key) as T)
  const pending = inflight.get(key)
  if (pending) return pending as Promise<T>

  const request = fetcher()
    .then((data) => {
      resolved.set(key, data)
      return data
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, request)
  return request
}

/** Seeds the cache with known data (e.g. data embedded in the page). */
export function primeResource<T>(key: string, data: T) {
  resolved.set(key, data)
}

/** Clears cached responses (used by tests). */
export function clearResourceCache() {
  resolved.clear()
  inflight.clear()
}

/**
 * Fetches a resource once per page session and shares it between components.
 * Concurrent callers reuse the same request; failed requests can be retried.
 */
export function useResource<T>(key: string, fetcher: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>(() =>
    resolved.has(key) ? { status: 'success', data: resolved.get(key) as T } : { status: 'loading' },
  )
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Always subscribe, even when the data is already cached: a shared request can
    // finish between this component's render and this effect. `load` resolves
    // immediately from the cache, and the update below is skipped if nothing changed.
    let active = true
    load(key, fetcher).then(
      (data) => {
        if (!active) return
        setState((previous) =>
          previous.status === 'success' && previous.data === data
            ? previous
            : { status: 'success', data },
        )
      },
      (error: unknown) =>
        active &&
        setState({
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        }),
    )
    return () => {
      active = false
    }
  }, [key, fetcher, attempt])

  const retry = useCallback(() => {
    resolved.delete(key)
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [key])

  return { ...state, retry }
}
