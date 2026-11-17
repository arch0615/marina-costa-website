import { expect, test, type Page } from '@playwright/test'
import { findSubmissionsBySubject } from './helpers.js'

async function openContactForm(page: Page) {
  await page.goto('/#contact')
  const form = page.getByRole('form', { name: 'Contact form' })
  await expect(form).toBeVisible()
  return form
}

test.describe('contact form', () => {
  test('validates required fields and email format on the client', async ({ page }) => {
    const form = await openContactForm(page)
    let posted = false
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/api/contact')) posted = true
    })

    await form.getByRole('button', { name: 'Send message' }).click()
    await expect(form.getByText('Please enter your name.')).toBeVisible()
    await expect(form.getByText('Please enter a subject.')).toBeVisible()

    await form.getByLabel('Email').fill('not-an-email')
    await form.getByLabel('Name').focus()
    await expect(form.getByText('Please enter a valid email address.')).toBeVisible()
    expect(posted).toBe(false)
  })

  test('submits a message, shows success and stores it', async ({ page }, testInfo) => {
    const subject = `E2E enquiry ${testInfo.project.name} ${Date.now()}`
    const form = await openContactForm(page)

    await form.getByLabel('Name').fill('Grace Hopper')
    await form.getByLabel('Email').fill('grace@example.com')
    await form.getByLabel(/Phone/).fill('+1 202 555 0123')
    await form.getByLabel('Subject').fill(subject)
    await form
      .getByLabel('Message')
      .fill('Hello! I would like to talk about a new brand identity for our startup.')
    // Real people take a moment to fill the form; instant submissions are treated as spam.
    await page.waitForTimeout(1100)
    await form.getByRole('button', { name: 'Send message' }).click()

    await expect(page.getByRole('heading', { name: 'Message sent' })).toBeVisible()

    const rows = await findSubmissionsBySubject(subject)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      status: 'NEW',
    })

    await page.getByRole('button', { name: 'Send another message' }).click()
    await expect(form.getByLabel('Name')).toHaveValue('')
  })

  test('shows an error and keeps the input when the server fails', async ({ page }) => {
    await page.route('**/api/contact', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Something went wrong. Please try again later.',
          },
        }),
      }),
    )
    const form = await openContactForm(page)
    await form.getByLabel('Name').fill('Grace Hopper')
    await form.getByLabel('Email').fill('grace@example.com')
    await form.getByLabel('Subject').fill('Server failure scenario')
    await form.getByLabel('Message').fill('This request is answered with a simulated server error.')
    await form.getByRole('button', { name: 'Send message' }).click()

    await expect(form.getByRole('alert')).toHaveText(
      'Something went wrong. Please try again later.',
    )
    await expect(form.getByLabel('Name')).toHaveValue('Grace Hopper')
  })

  test('shows a network error when the API is unreachable', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.abort('connectionrefused'))
    const form = await openContactForm(page)
    await form.getByLabel('Name').fill('Grace Hopper')
    await form.getByLabel('Email').fill('grace@example.com')
    await form.getByLabel('Subject').fill('Network failure scenario')
    await form
      .getByLabel('Message')
      .fill('This request never reaches the server at all, by design.')
    await form.getByRole('button', { name: 'Send message' }).click()

    await expect(form.getByRole('alert')).toContainText('could not reach the server')
  })

  test('the API rejects invalid data even without the browser checks', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: { name: 'A', email: 'nope', subject: '', message: 'short' },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(Object.keys(body.error.details)).toEqual(
      expect.arrayContaining(['name', 'email', 'subject', 'message']),
    )
  })
})
