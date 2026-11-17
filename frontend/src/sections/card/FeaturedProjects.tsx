import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { Skeleton } from '@/components/StatusViews'
import { usePortfolio } from '@/hooks/useSiteData'
import { externalLinkProps, safeExternalUrl } from '@/utils/contactLinks'

const MAX_FEATURED = 3

export function FeaturedProjects() {
  const { status, data } = usePortfolio()
  const featured = (data ?? []).filter((project) => project.isFeatured).slice(0, MAX_FEATURED)

  return (
    <section aria-labelledby="card-portfolio-title">
      <div className="flex items-center justify-between">
        <h2 id="card-portfolio-title" className="text-xl font-medium">
          Featured work
        </h2>
        <Link
          to="/#portfolio"
          className="inline-flex items-center gap-1 rounded-full text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Full portfolio
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {status === 'loading' ? (
        <div className="mt-4 flex flex-col gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : null}

      {featured.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {featured.map((project) => {
            const url = safeExternalUrl(project.projectUrl)
            const content = (
              <>
                {project.image ? (
                  <img
                    src={project.image}
                    alt=""
                    width={80}
                    height={60}
                    loading="lazy"
                    className="h-14 w-[4.5rem] shrink-0 rounded-lg border border-border object-cover"
                  />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{project.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {project.category}
                  </span>
                </span>
                {url ? (
                  <ArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground" />
                ) : null}
              </>
            )
            return (
              <li key={project.id}>
                {url ? (
                  <a
                    href={url}
                    {...externalLinkProps}
                    className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-accent"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-2">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
