import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildTestApp,
  createFakeMailer,
  createTestConfig,
  getTestDb,
  resetDatabase,
  validContact,
} from './helpers.js'

const submissions = () => getTestDb().contactSubmission.findMany({ orderBy: { createdAt: 'asc' } })

describe('POST /api/contact', () => {
  beforeEach(() => resetDatabase())

  it('stores a valid submission and sends an email notification', async () => {
    const mailer = createFakeMailer()
    const { app } = buildTestApp({ mailer })

    const res = await request(app).post('/api/contact').send(validContact)

    expect(res.status).toBe(201)
    expect(res.body.data.message).toMatch(/thank you/i)

    const [stored] = await submissions()
    expect(stored).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+44 20 7946 0958',
      subject: 'New website project',
      status: 'NEW',
    })
    expect(stored?.profileId).toBeTruthy()

    await vi.waitFor(() => expect(mailer.sent).toHaveLength(1))
    expect(mailer.sent[0]).toMatchObject({
      to: 'marina@example.com',
      replyTo: 'ada@example.com',
      subject: 'New website enquiry: New website project',
    })
    await vi.waitFor(async () => {
      const [row] = await submissions()
      expect(row?.notifiedAt).toBeInstanceOf(Date)
    })
  })

  it('sends notifications to CONTACT_RECIPIENT when configured', async () => {
    const mailer = createFakeMailer()
    const config = createTestConfig({ CONTACT_RECIPIENT: 'inbox@example.org' })
    const { app } = buildTestApp({ mailer, config })

    await request(app).post('/api/contact').send(validContact).expect(201)
    await vi.waitFor(() => expect(mailer.sent[0]?.to).toBe('inbox@example.org'))
  })

  it('escapes HTML from user input in the notification email', async () => {
    const mailer = createFakeMailer()
    const { app } = buildTestApp({ mailer })

    await request(app)
      .post('/api/contact')
      .send({ ...validContact, message: '<script>alert("x")</script> please contact me soon!' })
      .expect(201)

    await vi.waitFor(() => expect(mailer.sent).toHaveLength(1))
    expect(mailer.sent[0]?.html).not.toContain('<script>')
    expect(mailer.sent[0]?.html).toContain('&lt;script&gt;')
  })

  it('still stores the submission when email delivery fails', async () => {
    const mailer = createFakeMailer({ fail: true })
    const { app } = buildTestApp({ mailer })

    const res = await request(app).post('/api/contact').send(validContact)
    expect(res.status).toBe(201)

    const [stored] = await submissions()
    expect(stored?.notifiedAt).toBeNull()
  })

  it('stores submissions without sending when SMTP is not configured', async () => {
    const mailer = createFakeMailer({ configured: false })
    const { app } = buildTestApp({ mailer })

    await request(app).post('/api/contact').send(validContact).expect(201)
    expect(await submissions()).toHaveLength(1)
    expect(mailer.sent).toHaveLength(0)
  })

  it('trims input, strips unknown fields and treats an empty phone as absent', async () => {
    const { app } = buildTestApp()
    await request(app)
      .post('/api/contact')
      .send({ ...validContact, name: '  Ada  ', phone: '', status: 'ARCHIVED', id: 'hack' })
      .expect(201)

    const [stored] = await submissions()
    expect(stored?.name).toBe('Ada')
    expect(stored?.phone).toBeNull()
    expect(stored?.status).toBe('NEW')
  })

  describe('validation', () => {
    it('rejects missing required fields with field-level errors', async () => {
      const { app } = buildTestApp()
      const res = await request(app).post('/api/contact').send({})

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
      expect(Object.keys(res.body.error.details).sort()).toEqual([
        'email',
        'message',
        'name',
        'subject',
      ])
      expect(await submissions()).toHaveLength(0)
    })

    it.each([
      ['an invalid email', { email: 'not-an-email' }, 'email'],
      ['a short message', { message: 'Too short' }, 'message'],
      ['a long message', { message: 'x'.repeat(5001) }, 'message'],
      ['an invalid phone', { phone: 'call me maybe' }, 'phone'],
      ['a short subject', { subject: 'Hi' }, 'subject'],
      ['a non-string name', { name: 42 }, 'name'],
    ])('rejects %s', async (_label, override, field) => {
      const { app } = buildTestApp()
      const res = await request(app)
        .post('/api/contact')
        .send({ ...validContact, ...override })

      expect(res.status).toBe(400)
      expect(res.body.error.details).toHaveProperty(field)
    })

    it('collapses line breaks in single-line fields (no header injection)', async () => {
      const mailer = createFakeMailer()
      const { app } = buildTestApp({ mailer })
      await request(app)
        .post('/api/contact')
        .send({ ...validContact, subject: 'Hello\r\nBcc: victim@example.com' })
        .expect(201)

      const [stored] = await submissions()
      expect(stored?.subject).not.toMatch(/[\r\n]/)
      await vi.waitFor(() => expect(mailer.sent[0]?.subject).not.toMatch(/[\r\n]/))
    })

    it('rejects non-JSON bodies with 415', async () => {
      const { app } = buildTestApp()
      const res = await request(app)
        .post('/api/contact')
        .type('form')
        .send('name=Ada&email=ada@example.com')

      expect(res.status).toBe(415)
      expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE')
    })

    it('rejects malformed JSON with 400', async () => {
      const { app } = buildTestApp()
      const res = await request(app)
        .post('/api/contact')
        .set('Content-Type', 'application/json')
        .send('{"name": ')

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('BAD_REQUEST')
    })

    it('rejects oversized payloads with 413', async () => {
      const { app } = buildTestApp()
      const res = await request(app)
        .post('/api/contact')
        .send({ ...validContact, message: 'x'.repeat(40_000) })

      expect(res.status).toBe(413)
      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE')
    })
  })

  describe('spam protection', () => {
    it('silently discards submissions that fill the honeypot', async () => {
      const mailer = createFakeMailer()
      const { app } = buildTestApp({ mailer })
      const res = await request(app)
        .post('/api/contact')
        .send({ ...validContact, botField: 'https://spam.example' })

      expect(res.status).toBe(201)
      expect(await submissions()).toHaveLength(0)
      expect(mailer.sent).toHaveLength(0)
    })

    it('silently discards submissions sent faster than a human could type', async () => {
      const { app } = buildTestApp()
      const res = await request(app)
        .post('/api/contact')
        .send({ ...validContact, elapsedMs: 300 })

      expect(res.status).toBe(201)
      expect(await submissions()).toHaveLength(0)
    })
  })
})
