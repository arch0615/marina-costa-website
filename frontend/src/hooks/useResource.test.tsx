import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLayoutEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { primeResource, useResource } from './useResource'

function Consumer({
  fetcher,
  resourceKey = 'item',
}: {
  fetcher: () => Promise<string>
  resourceKey?: string
}) {
  const { status, data, retry } = useResource(resourceKey, fetcher)
  return (
    <div>
      <p>
        {status}:{data ?? ''}
      </p>
      <button onClick={retry}>retry</button>
    </div>
  )
}

describe('useResource', () => {
  it('loads data and shares one request between consumers', async () => {
    const fetcher = vi.fn().mockResolvedValue('value')
    render(
      <>
        <Consumer fetcher={fetcher} />
        <Consumer fetcher={fetcher} />
      </>,
    )

    expect(await screen.findAllByText('success:value')).toHaveLength(2)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('settles when the shared data arrives between render and effect', async () => {
    // Regression: the card page stayed on its skeleton when the profile request
    // (started by the home page) finished after the card rendered but before its effect ran.
    const fetcher = vi.fn(() => new Promise<string>(() => {}))
    function Primer() {
      useLayoutEffect(() => primeResource('race', 'cached'), [])
      return null
    }
    render(
      <>
        <Consumer fetcher={fetcher} resourceKey="race" />
        <Primer />
      </>,
    )

    expect(await screen.findByText('success:cached')).toBeInTheDocument()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('reports errors and recovers on retry', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('back')
    const user = userEvent.setup({ delay: null })
    render(<Consumer fetcher={fetcher} resourceKey="flaky" />)

    expect(await screen.findByText('error:')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'retry' }))
    expect(await screen.findByText('success:back')).toBeInTheDocument()
  })
})
