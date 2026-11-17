import { z } from 'zod'

/** Field length limits shared by the form UI, API validation and the database. */
export const CONTACT_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  phone: { max: 30 },
  subject: { min: 3, max: 150 },
  message: { min: 20, max: 5000 },
} as const

// Control characters (except tab/newline/carriage return) never belong in form input.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_AND_NEWLINES = /[\u0000-\u001F\u007F]/g

const stripControl = (value: string) => value.replace(CONTROL_CHARS, '')
const toSingleLine = (value: string) => value.replace(CONTROL_CHARS_AND_NEWLINES, ' ')

const PHONE_PATTERN = /^\+?[\d\s().-]{7,30}$/

export const contactFormSchema = z.object({
  name: z
    .string({ error: 'Please enter your name.' })
    .overwrite(toSingleLine)
    .trim()
    .min(CONTACT_LIMITS.name.min, 'Please enter your name.')
    .max(CONTACT_LIMITS.name.max, `Name must be at most ${CONTACT_LIMITS.name.max} characters.`),
  email: z
    .string({ error: 'Please enter your email address.' })
    .trim()
    .min(1, 'Please enter your email address.')
    .max(CONTACT_LIMITS.email.max, 'Email address is too long.')
    .pipe(z.email('Please enter a valid email address.')),
  phone: z
    .string({ error: 'Please enter a valid phone number.' })
    .overwrite(toSingleLine)
    .trim()
    .max(CONTACT_LIMITS.phone.max, 'Phone number is too long.')
    .refine((value) => value === '' || PHONE_PATTERN.test(value), {
      message: 'Please enter a valid phone number.',
    })
    .optional(),
  subject: z
    .string({ error: 'Please enter a subject.' })
    .overwrite(toSingleLine)
    .trim()
    .min(CONTACT_LIMITS.subject.min, 'Please enter a subject.')
    .max(
      CONTACT_LIMITS.subject.max,
      `Subject must be at most ${CONTACT_LIMITS.subject.max} characters.`,
    ),
  message: z
    .string({ error: 'Please write a message.' })
    .overwrite(stripControl)
    .trim()
    .min(
      CONTACT_LIMITS.message.min,
      `Please write at least ${CONTACT_LIMITS.message.min} characters.`,
    )
    .max(
      CONTACT_LIMITS.message.max,
      `Message must be at most ${CONTACT_LIMITS.message.max} characters.`,
    ),
})

/**
 * Full request body accepted by `POST /api/contact`.
 * `botField` is a honeypot that humans never see. `elapsedMs` is how long the form
 * was open before submitting, measured on the client as a duration (immune to clock
 * skew); submissions that are implausibly fast are treated as spam.
 */
export const contactRequestSchema = contactFormSchema.extend({
  botField: z.string().max(500).optional(),
  elapsedMs: z.number().int().nonnegative().max(604_800_000).optional(),
})

export type ContactFormInput = z.input<typeof contactFormSchema>
export type ContactFormValues = z.output<typeof contactFormSchema>
export type ContactRequest = z.output<typeof contactRequestSchema>
