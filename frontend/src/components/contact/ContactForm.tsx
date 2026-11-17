import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useForm, useWatch, type FieldPath } from 'react-hook-form'
import { CONTACT_LIMITS, contactFormSchema } from '@presence/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/services/apiClient'
import { submitContact } from '@/services/contactApi'
import type { ContactFormInput, ContactFormValues } from '@/types'
import { useContactPrefill } from './ContactPrefill'

const FIELDS = ['name', 'email', 'phone', 'subject', 'message'] as const

const DEFAULT_VALUES: ContactFormInput = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
}

interface FieldProps {
  id: string
  label: string
  error: string | undefined
  optional?: boolean
  hint?: ReactNode
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }) => ReactNode
}

function Field({ id, label, error, optional, hint, children }: FieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {optional ? <span className="font-normal text-muted-foreground"> (optional)</span> : null}
        </Label>
        {hint ? (
          <span id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </div>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function ContactForm() {
  const baseId = useId()
  const { subject: prefilledSubject } = useContactPrefill()
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const honeypotRef = useRef<HTMLInputElement>(null)
  const openedAt = useRef(0)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    setFocus,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput, unknown, ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  })

  useEffect(() => {
    openedAt.current = performance.now()
  }, [submitted])

  useEffect(() => {
    if (prefilledSubject) setValue('subject', prefilledSubject, { shouldValidate: false })
  }, [prefilledSubject, setValue])

  const messageLength = useWatch({ control, name: 'message' })?.length ?? 0

  const onSubmit = async (values: ContactFormValues) => {
    setFormError(null)
    try {
      await submitContact({
        ...values,
        botField: honeypotRef.current?.value || undefined,
        elapsedMs: Math.round(performance.now() - openedAt.current),
      })
      reset(DEFAULT_VALUES)
      setSubmitted(true)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR' && error.details) {
        let focused = false
        for (const [field, messages] of Object.entries(error.details)) {
          if ((FIELDS as readonly string[]).includes(field) && messages[0]) {
            setError(field as FieldPath<ContactFormInput>, { message: messages[0] })
            if (!focused) {
              setFocus(field as FieldPath<ContactFormInput>)
              focused = true
            }
          }
        }
        setFormError('Please correct the highlighted fields and try again.')
        return
      }
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Your message could not be sent. Please try again later.',
      )
    }
  }

  if (submitted) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 aria-hidden="true" className="size-7" />
        </span>
        <h3 className="text-2xl font-medium">Message sent</h3>
        <p className="max-w-sm text-muted-foreground">
          Thank you for reaching out. I usually reply within one or two business days.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)} className="mt-2">
          Send another message
        </Button>
      </div>
    )
  }

  const id = (name: string) => `${baseId}-${name}`

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
      aria-label="Contact form"
      className="flex flex-col gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id('name')} label="Name" error={errors.name?.message}>
          {(props) => <Input {...props} autoComplete="name" {...register('name')} />}
        </Field>
        <Field id={id('email')} label="Email" error={errors.email?.message}>
          {(props) => (
            <Input
              {...props}
              type="email"
              autoComplete="email"
              inputMode="email"
              {...register('email')}
            />
          )}
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id('phone')} label="Phone" optional error={errors.phone?.message}>
          {(props) => (
            <Input
              {...props}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              {...register('phone')}
            />
          )}
        </Field>
        <Field id={id('subject')} label="Subject" error={errors.subject?.message}>
          {(props) => <Input {...props} {...register('subject')} />}
        </Field>
      </div>
      <Field
        id={id('message')}
        label="Message"
        error={errors.message?.message}
        hint={`${messageLength}/${CONTACT_LIMITS.message.max}`}
      >
        {(props) => (
          <Textarea
            {...props}
            rows={6}
            maxLength={CONTACT_LIMITS.message.max}
            placeholder="Tell me a little about your project, timeline and goals."
            {...register('message')}
          />
        )}
      </Field>

      {/* Honeypot: hidden from people and assistive technology, tempting for bots. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor={id('bot')}>Leave this field empty</label>
        <input
          ref={honeypotRef}
          id={id('bot')}
          name="botField"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {formError ? (
        <p
          role="alert"
          className="rounded-lg bg-destructive-soft px-4 py-3 text-sm text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Your details are only used to reply to your message.
        </p>
        <Button type="submit" size="lg" disabled={isSubmitting} className="sm:min-w-44">
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Send aria-hidden="true" />
          )}
          {isSubmitting ? 'Sending…' : 'Send message'}
        </Button>
      </div>
    </form>
  )
}
