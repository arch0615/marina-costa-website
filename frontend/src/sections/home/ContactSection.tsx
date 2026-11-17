import { Mail, MapPin, MessageCircle, Phone, type LucideIcon } from 'lucide-react'
import { ContactForm } from '@/components/contact/ContactForm'
import { Container } from '@/components/Container'
import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'
import { Skeleton } from '@/components/StatusViews'
import { useProfile } from '@/hooks/useSiteData'
import {
  emailHref,
  externalLinkProps,
  mapsHref,
  phoneHref,
  whatsappHref,
} from '@/utils/contactLinks'

interface Method {
  label: string
  value: string
  href: string
  icon: LucideIcon
  external?: boolean
}

export function ContactSection() {
  const { data: profile, status } = useProfile()

  const methods: Method[] = profile
    ? [
        { label: 'Email', value: profile.email, href: emailHref(profile.email), icon: Mail },
        ...(profile.phone
          ? [{ label: 'Phone', value: profile.phone, href: phoneHref(profile.phone), icon: Phone }]
          : []),
        ...(profile.whatsapp
          ? [
              {
                label: 'WhatsApp',
                value: 'Send a message',
                href: whatsappHref(
                  profile.whatsapp,
                  `Hi ${profile.fullName.split(' ')[0]}, I found you through your website.`,
                ),
                icon: MessageCircle,
                external: true,
              },
            ]
          : []),
        ...(profile.location
          ? [
              {
                label: 'Location',
                value: profile.location,
                href: mapsHref(profile.location),
                icon: MapPin,
                external: true,
              },
            ]
          : []),
      ]
    : []

  return (
    <section id="contact" aria-labelledby="contact-title" className="py-section">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <SectionHeading
            id="contact-title"
            eyebrow="Contact"
            title="Let's build something clear together."
            description="Tell me about your project. I reply to every message personally, usually within two business days."
          />

          <ul className="mt-10 flex flex-col gap-3">
            {status === 'loading'
              ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-16" />)
              : methods.map((method) => (
                  <li key={method.label}>
                    <a
                      href={method.href}
                      {...(method.external ? externalLinkProps : {})}
                      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <method.icon aria-hidden="true" className="size-[1.1rem]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-muted-foreground">
                          {method.label}
                        </span>
                        <span className="block truncate font-medium">{method.value}</span>
                      </span>
                    </a>
                  </li>
                ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-7">
          <div className="relative rounded-[1.75rem] border border-border bg-card p-6 shadow-soft sm:p-9">
            <ContactForm />
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
