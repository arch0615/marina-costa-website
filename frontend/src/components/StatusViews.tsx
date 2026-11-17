import { AlertCircle, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-muted', className)} />
}

/** Announces loading to assistive technology while showing a visual placeholder. */
export function LoadingRegion({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
  tone?: 'default' | 'inverted'
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'This content could not be loaded.',
  onRetry,
  className,
  tone = 'default',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center',
        tone === 'inverted' ? 'border-white/25 text-white' : 'border-border bg-card/60',
        className,
      )}
    >
      <AlertCircle aria-hidden="true" className="size-6 text-destructive" />
      <div>
        <p className="font-medium">{title}</p>
        <p
          className={cn(
            'mt-1 text-sm',
            tone === 'inverted' ? 'text-white/75' : 'text-muted-foreground',
          )}
        >
          {message}
        </p>
      </div>
      {onRetry ? (
        <Button
          variant={tone === 'inverted' ? 'outline-inverted' : 'outline'}
          size="sm"
          onClick={onRetry}
        >
          <RotateCw aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyState({ message, className }: { message: string; className?: string }) {
  return (
    <p
      className={cn(
        'rounded-xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground',
        className,
      )}
    >
      {message}
    </p>
  )
}
