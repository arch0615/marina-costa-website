import { ArrowRight } from 'lucide-react'
import { useContactPrefill } from '@/components/contact/ContactPrefill'
import { Container } from '@/components/Container'
import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'
import { ServiceIcon } from '@/components/ServiceIcon'
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '@/components/StatusViews'
import { useServices } from '@/hooks/useSiteData'

export function ServicesSection() {
  const { status, data: services, retry } = useServices()
  const { prefillSubject } = useContactPrefill()

  return (
    <section
      id="services"
      aria-labelledby="services-title"
      className="border-y border-border bg-card py-section"
    >
      <Container>
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="services-title"
            eyebrow="Services"
            title="How I can help"
            description="Focused engagements for teams that want a stronger brand and better digital experiences."
          />
        </Reveal>

        <div className="mt-12 lg:mt-16">
          {status === 'loading' ? (
            <LoadingRegion
              label="Loading services"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-56" />
              ))}
            </LoadingRegion>
          ) : null}
          {status === 'error' ? (
            <ErrorState message="Services could not be loaded." onRetry={retry} />
          ) : null}
          {status === 'success' && services.length === 0 ? (
            <EmptyState message="Services will be listed here soon." />
          ) : null}

          {services && services.length > 0 ? (
            <ul className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <li
                  key={service.id}
                  className="group flex flex-col bg-card p-7 transition-colors hover:bg-background/60 sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-full bg-highlight-soft text-highlight">
                      <ServiceIcon name={service.icon} className="size-5" />
                    </span>
                    <span aria-hidden="true" className="font-display text-sm text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-7 text-xl font-medium">{service.title}</h3>
                  <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                  <a
                    href="#contact"
                    onClick={() => prefillSubject(`Enquiry: ${service.title}`)}
                    className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    aria-label={`Discuss ${service.title}`}
                  >
                    Discuss this service
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
