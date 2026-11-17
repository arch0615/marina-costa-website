import { ArrowUpRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Container } from '@/components/Container'
import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '@/components/StatusViews'
import { usePortfolio } from '@/hooks/useSiteData'
import type { PortfolioItemDto } from '@/types'
import { cn } from '@/utils/cn'
import { externalLinkProps, safeExternalUrl } from '@/utils/contactLinks'

const ALL = 'All'

function ProjectCard({ project }: { project: PortfolioItemDto }) {
  const url = safeExternalUrl(project.projectUrl)

  return (
    <article className="group relative flex h-full flex-col">
      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        {project.image ? (
          <img
            src={project.image}
            alt={`${project.title} project preview`}
            width={800}
            height={600}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="aspect-[4/3] w-full" />
        )}
      </div>
      <div className="mt-5 flex flex-1 flex-col">
        <p className="text-xs font-semibold tracking-[0.14em] text-highlight uppercase">
          {project.category}
        </p>
        <h3 className="mt-2 text-xl font-medium">
          {url ? (
            <a
              href={url}
              {...externalLinkProps}
              className="inline-flex items-start gap-1.5 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {project.title}
              <ArrowUpRight
                aria-hidden="true"
                className="mt-1 size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
              />
              <span className="sr-only">(opens case study in a new tab)</span>
            </a>
          ) : (
            project.title
          )}
        </h3>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
          {project.description}
        </p>
        {project.technologies.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
            {project.technologies.map((tech) => (
              <li
                key={tech}
                className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {tech}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {/* Visible focus ring for the stretched link */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 rounded-3xl ring-ring/60 group-has-[a:focus-visible]:ring-2"
      />
    </article>
  )
}

export function PortfolioSection() {
  const { status, data: projects, retry } = usePortfolio()
  const [category, setCategory] = useState(ALL)

  const categories = useMemo(
    () => (projects ? [ALL, ...new Set(projects.map((project) => project.category))] : []),
    [projects],
  )
  const visible = useMemo(
    () => (projects ?? []).filter((project) => category === ALL || project.category === category),
    [projects, category],
  )

  return (
    <section id="portfolio" aria-labelledby="portfolio-title" className="py-section">
      <Container>
        <Reveal className="flex flex-col gap-8">
          <SectionHeading
            id="portfolio-title"
            eyebrow="Portfolio"
            title="Selected work"
            description="A few recent projects across branding, websites and digital products."
          />
          {categories.length > 2 ? (
            <div
              role="group"
              aria-label="Filter projects by category"
              className="flex flex-wrap gap-2"
            >
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                  className={cn(
                    'h-10 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors',
                    category === item
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:bg-accent',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </Reveal>

        <div className="mt-12 lg:mt-16">
          {status === 'loading' ? (
            <LoadingRegion
              label="Loading projects"
              className="grid gap-10 md:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="aspect-[4/3]" />
              ))}
            </LoadingRegion>
          ) : null}
          {status === 'error' ? (
            <ErrorState message="Projects could not be loaded." onRetry={retry} />
          ) : null}
          {status === 'success' && visible.length === 0 ? (
            <EmptyState message="New projects are coming soon." />
          ) : null}

          {visible.length > 0 ? (
            <ul className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((project, index) => (
                <li key={project.id}>
                  <Reveal delay={(index % 3) * 0.06} className="h-full">
                    <ProjectCard project={project} />
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
