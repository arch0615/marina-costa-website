import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn'

/** Horizontal page container: consistent max width and side padding at every breakpoint. */
export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-6xl px-5 sm:px-8', className)} {...props} />
}
