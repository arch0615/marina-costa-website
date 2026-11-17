import type { SocialLinkDto } from '@/types'
import { cn } from '@/utils/cn'
import { externalLinkProps, safeExternalUrl } from '@/utils/contactLinks'
import { SOCIAL_LABELS } from '@/utils/social'
import { SocialIcon } from './SocialIcon'

interface SocialLinksProps {
  links: SocialLinkDto[]
  ownerName: string
  variant?: 'default' | 'inverted' | 'soft'
  className?: string
}

const VARIANTS = {
  default:
    'border border-border bg-card text-foreground hover:border-foreground/25 hover:bg-accent',
  soft: 'bg-secondary text-foreground hover:bg-secondary/70',
  inverted: 'border border-white/20 text-white hover:bg-white/10',
} as const

/** Renders only configured social networks with accessible labels. */
export function SocialLinks({
  links,
  ownerName,
  variant = 'default',
  className,
}: SocialLinksProps) {
  const valid = links.flatMap((link) => {
    const url = safeExternalUrl(link.url)
    return url ? [{ ...link, url }] : []
  })
  if (valid.length === 0) return null

  return (
    <ul className={cn('flex flex-wrap items-center gap-2', className)} aria-label="Social media">
      {valid.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            {...externalLinkProps}
            aria-label={`${ownerName} on ${SOCIAL_LABELS[link.platform]} (opens in a new tab)`}
            className={cn(
              'inline-flex size-11 items-center justify-center rounded-full transition-colors',
              VARIANTS[variant],
            )}
          >
            <SocialIcon platform={link.platform} className="size-[1.05rem]" />
          </a>
        </li>
      ))}
    </ul>
  )
}
