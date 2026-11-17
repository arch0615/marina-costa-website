import { useState } from 'react'
import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/format'

interface ProfileAvatarProps {
  name: string
  src: string | null
  className?: string
  /** Pass true for above-the-fold images (hero, card header). */
  priority?: boolean
  width: number
  height: number
}

/** Profile image with explicit dimensions and an initials fallback if it is missing or fails. */
export function ProfileAvatar({
  name,
  src,
  className,
  priority = false,
  width,
  height,
}: ProfileAvatarProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={name}
        className={cn(
          'flex items-center justify-center bg-primary font-display text-primary-foreground',
          className,
        )}
      >
        <span aria-hidden="true" className="text-[length:inherit]">
          {getInitials(name)}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`Portrait of ${name}`}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  )
}
