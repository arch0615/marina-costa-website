import { Link } from 'react-router'
import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/format'

interface LogoProps {
  name: string | undefined
  tone?: 'default' | 'inverted'
  className?: string
}

/** Monogram + name wordmark linking to the top of the presentation page. */
export function Logo({ name, tone = 'default', className }: LogoProps) {
  return (
    <Link
      to="/"
      className={cn('group inline-flex items-center gap-3 rounded-full', className)}
      aria-label={name ? `${name} — home` : 'Home'}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-9 items-center justify-center rounded-full font-display text-[0.95rem] font-medium tracking-tight transition-transform group-hover:scale-105',
          tone === 'inverted' ? 'bg-white text-primary' : 'bg-primary text-primary-foreground',
        )}
      >
        {name ? getInitials(name) : ''}
      </span>
      <span
        className={cn(
          'text-[0.95rem] font-semibold tracking-tight',
          tone === 'inverted' ? 'text-white' : 'text-foreground',
          !name && 'h-4 w-28 animate-pulse rounded bg-muted',
        )}
      >
        {name}
      </span>
    </Link>
  )
}
