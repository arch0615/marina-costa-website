import { Award, Briefcase } from 'lucide-react'
import { Container } from '@/components/Container'
import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'
import { ErrorState, LoadingRegion, Skeleton } from '@/components/StatusViews'
import { useProfile } from '@/hooks/useSiteData'
import type { ProfileDto } from '@/types'
import { formatYearRange, toParagraphs, yearsOfExperience } from '@/utils/format'

function Facts({ profile }: { profile: ProfileDto }) {
  const years = yearsOfExperience(profile.experience)
  const facts = [
    years ? { label: 'Experience', value: `${years}+ years` } : null,
    profile.location ? { label: 'Based in', value: profile.location } : null,
    profile.companyName ? { label: 'Studio', value: profile.companyName } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null)

  return (
    <dl className="mt-10 grid grid-cols-1 gap-6 border-t border-border pt-8 min-[420px]:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {fact.label}
          </dt>
          <dd className="mt-1.5 font-display text-xl">{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function AboutSection() {
  const { status, data: profile, retry } = useProfile()

  return (
    <section id="about" aria-labelledby="about-title" className="py-section">
      <Container>
        {status === 'loading' ? (
          <LoadingRegion label="Loading biography" className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-40" />
            <Skeleton className="h-64" />
          </LoadingRegion>
        ) : null}
        {status === 'error' ? (
          <ErrorState message="The biography could not be loaded." onRetry={retry} />
        ) : null}

        {profile ? (
          <>
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <Reveal className="lg:col-span-5">
                <SectionHeading
                  id="about-title"
                  eyebrow="About"
                  title="Clarity, craft and a calm, collaborative process."
                />
                <Facts profile={profile} />
              </Reveal>

              <Reveal delay={0.08} className="lg:col-span-7">
                <div className="flex flex-col gap-5 text-[1.0625rem] leading-relaxed text-foreground/85">
                  {toParagraphs(profile.biography).map((paragraph) => (
                    <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                  ))}
                </div>
                {profile.skills.length > 0 ? (
                  <div className="mt-10">
                    <h3 className="font-sans text-sm font-semibold">Skills &amp; tools</h3>
                    <ul className="mt-4 flex flex-wrap gap-2" aria-label="Skills">
                      {profile.skills.map((skill) => (
                        <li
                          key={skill}
                          className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Reveal>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:mt-20">
              {profile.experience.length > 0 ? (
                <Reveal className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                  <h3 className="flex items-center gap-2.5 font-sans text-sm font-semibold">
                    <Briefcase aria-hidden="true" className="size-4 text-highlight" />
                    Experience
                  </h3>
                  <ol className="mt-6 flex flex-col gap-6">
                    {profile.experience.map((item) => (
                      <li key={item.id} className="relative border-l border-border pl-5">
                        <span
                          aria-hidden="true"
                          className="absolute top-1.5 -left-[4.5px] size-2 rounded-full bg-highlight"
                        />
                        <p className="text-xs font-medium text-muted-foreground">
                          {formatYearRange(item.startDate, item.endDate)}
                        </p>
                        <p className="mt-1 font-medium">
                          {item.role} ·{' '}
                          <span className="text-muted-foreground">{item.organization}</span>
                        </p>
                        {item.description ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </Reveal>
              ) : null}

              {profile.qualifications.length > 0 ? (
                <Reveal
                  delay={0.08}
                  className="rounded-2xl border border-border bg-card p-6 sm:p-8"
                >
                  <h3 className="flex items-center gap-2.5 font-sans text-sm font-semibold">
                    <Award aria-hidden="true" className="size-4 text-highlight" />
                    Qualifications
                  </h3>
                  <ul className="mt-6 flex flex-col divide-y divide-border">
                    {profile.qualifications.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.institution}</p>
                        </div>
                        {item.year ? (
                          <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                            {item.year}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ) : null}
            </div>
          </>
        ) : null}
      </Container>
    </section>
  )
}
