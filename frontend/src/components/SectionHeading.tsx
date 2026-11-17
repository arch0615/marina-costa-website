import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface SectionHeadingProps {
  id?: string
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      <p className="mb-4 inline-flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-highlight uppercase">
        <span aria-hidden="true" className="h-px w-8 bg-highlight/60" />
        {eyebrow}
      </p>
      <h2 id={id} className="text-heading font-medium text-foreground">
        {title}
      </h2>
      {description ? <p className="mt-5 text-lead text-muted-foreground">{description}</p> : null}
    </div>
  )
}
