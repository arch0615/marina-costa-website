import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { mockApi, requestBodies } from '@/test/api-mock'
import { ContactForm } from './ContactForm'

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), 'Ada Lovelace')
  await user.type(screen.getByLabelText('Email'), 'ada@example.com')
  await user.type(screen.getByLabelText(/phone/i), '+44 20 7946 0958')
  await user.type(screen.getByLabelText('Subject'), 'New website')
  await user.type(
    screen.getByLabelText('Message'),
    'I would love to discuss a new website for our company.',
  )
}

describe('ContactForm', () => {
  it('shows required field errors and does not submit an empty form', async () => {
    const fetchMock = mockApi()
    const user = userEvent.setup({ delay: null })
    render(<ContactForm />)

    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText('Please enter your name.')).toBeInTheDocument()
    expect(screen.getByText('Please enter your email address.')).toBeInTheDocument()
    expect(screen.getByText('Please enter a subject.')).toBeInTheDocument()
    expect(screen.getByText(/at least 20 characters/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
    expect(requestBodies(fetchMock, 'POST', '/api/contact')).toHaveLength(0)
  })

  it('validates the email format', async () => {
    mockApi()
    const user = userEvent.setup({ delay: null })
    render(<ContactForm />)

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.tab()

    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument()
  })

  it('submits valid data, shows a loading state and then success', async () => {
    let release: () => void = () => {}
    const fetchMock = mockApi({
      'POST /api/contact': () =>
        new Promise((resolve) => {
          release = () => resolve({ status: 201, body: { data: { message: 'ok' } } })
        }),
    })
    const user = userEvent.setup({ delay: null })
    render(<ContactForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByRole('button', { name: /sending/i })).toBeDisabled()
    release()
    expect(await screen.findByRole('heading', { name: 'Message sent' })).toBeInTheDocument()

    const [body] = requestBodies(fetchMock, 'POST', '/api/contact')
    expect(body).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+44 20 7946 0958',
      subject: 'New website',
    })
    expect(body?.botField).toBeUndefined()
    expect(typeof body?.elapsedMs).toBe('number')
  })

  it('maps server-side validation errors onto fields', async () => {
    mockApi({
      'POST /api/contact': () => ({
        status: 400,
        body: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some fields are invalid.',
            details: { email: ['This email domain is not accepted.'] },
          },
        },
      }),
    })
    const user = userEvent.setup({ delay: null })
    render(<ContactForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText('This email domain is not accepted.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/correct the highlighted fields/i)
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows the server message when rate limited', async () => {
    mockApi({
      'POST /api/contact': () => ({
        status: 429,
        body: {
          error: { code: 'RATE_LIMITED', message: 'You have sent several messages recently.' },
        },
      }),
    })
    const user = userEvent.setup({ delay: null })
    render(<ContactForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You have sent several messages recently.',
    )
    expect(screen.getByLabelText('Name')).toHaveValue('Ada Lovelace')
  })

  it('shows a friendly error when the network fails', async () => {
    mockApi()
    const user = userEvent.setup({ delay: null })
    render(<ContactForm />)
    await fillValidForm(user)

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the server/i)
  })
})
