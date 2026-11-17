import { Container } from '@/components/Container'
import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'
import { ErrorState, LoadingRegion, Skeleton } from '@/components/StatusViews'
import { useTestimonials } from '@/hooks/useSiteData'
import type { TestimonialDto } from '@/types'
import { getInitials } from '@/utils/format'

function AuthorAvatar({ testimonial }: { testimonial: TestimonialDto }) {
  if (testimonial.authorImage) {
    return (
      <img
        src={testimonial.authorImage}
        alt=""
        width={44}
        height={44}
        loading="lazy"
        className="size-11 rounded-full object-cover"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-11 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground"
    >
      {getInitials(testimonial.authorName)}
    </span>
  )
}

export function TestimonialsSection() {
  const { status, data: testimonials, retry } = useTestimonials()

  // Testimonials are optional: the section disappears when there are none.
  if (status === 'success' && testimonials.length === 0) return null

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="bg-secondary/45 py-section"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="testimonials-title"
            eyebrow="Testimonials"
            title="Kind words from clients"
            align="center"
          />
        </Reveal>

        <div className="mt-12 lg:mt-16">
          {status === 'loading' ? (
            <LoadingRegion label="Loading testimonials" className="grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-64 bg-card" />
              ))}
            </LoadingRegion>
          ) : null}
          {status === 'error' ? (
            <ErrorState message="Testimonials could not be loaded." onRetry={retry} />
          ) : null}

          {testimonials ? (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <li
                  key={testimonial.id}
                  className={index === 2 ? 'md:col-span-2 lg:col-span-1' : undefined}
                >
                  <Reveal delay={index * 0.06} className="h-full">
                    <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-soft sm:p-8">
                      <span
                        aria-hidden="true"
                        className="font-display text-5xl leading-none text-highlight/70"
                      >
                        “
                      </span>
                      <blockquote className="mt-2 flex-1 font-display text-lg leading-relaxed text-foreground/90">
                        <p>{testimonial.quote}</p>
                      </blockquote>
                      <figcaption className="mt-8 flex items-center gap-3 border-t border-border pt-6">
                        <AuthorAvatar testimonial={testimonial} />
                        <div>
                          <p className="text-sm font-semibold">{testimonial.authorName}</p>
                          <p className="text-sm text-muted-foreground">
                            {[testimonial.authorRole, testimonial.authorCompany]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      </figcaption>
                    </figure>
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
