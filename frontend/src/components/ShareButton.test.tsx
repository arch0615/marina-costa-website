import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShareButton } from './ShareButton'

const payload = {
  title: 'Marina Costa · Digital Business Card',
  text: 'Marina Costa — Designer',
  url: 'https://www.example.com/card',
}

function setNavigator(values: Partial<Navigator>) {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(navigator, key, { value, configurable: true, writable: true })
  }
}

describe('ShareButton', () => {
  afterEach(() => {
    setNavigator({ share: undefined, canShare: undefined } as unknown as Partial<Navigator>)
  })

  it('uses the Web Share API when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    setNavigator({ share, canShare: () => true })
    const user = userEvent.setup({ delay: null })
    render(<ShareButton payload={payload} />)

    await user.click(screen.getByRole('button', { name: /share/i }))

    expect(share).toHaveBeenCalledWith(payload)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does nothing more when the user cancels the native share sheet', async () => {
    setNavigator({ share: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')) })
    const user = userEvent.setup({ delay: null })
    render(<ShareButton payload={payload} />)

    await user.click(screen.getByRole('button', { name: /share/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('falls back to a share dialog with copy, WhatsApp and email options', async () => {
    setNavigator({ share: undefined } as unknown as Partial<Navigator>)
    const user = userEvent.setup({ delay: null })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<ShareButton payload={payload} />)

    await user.click(screen.getByRole('button', { name: /share/i }))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).getByLabelText('Link')).toHaveValue(payload.url)
    const options = within(dialog).getByRole('list', { name: 'Share via' })
    expect(within(options).getByRole('link', { name: 'WhatsApp' }).getAttribute('href')).toBe(
      `https://wa.me/?text=${encodeURIComponent(`${payload.text} ${payload.url}`)}`,
    )
    expect(within(options).getByRole('link', { name: 'Email' }).getAttribute('href')).toMatch(
      /^mailto:\?subject=/,
    )

    await user.click(within(dialog).getByRole('button', { name: /copy/i }))
    expect(writeText).toHaveBeenCalledWith(payload.url)
    expect(await within(dialog).findByRole('button', { name: /copied/i })).toBeInTheDocument()
  })

  it('falls back to the dialog when native sharing fails unexpectedly', async () => {
    setNavigator({ share: vi.fn().mockRejectedValue(new Error('NotAllowedError')) })
    const user = userEvent.setup({ delay: null })
    render(<ShareButton payload={payload} />)

    await user.click(screen.getByRole('button', { name: /share/i }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })
})
