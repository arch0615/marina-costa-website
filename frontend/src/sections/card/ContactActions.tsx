import { MapPin } from 'lucide-react'
import type { ProfileDto } from '@/types'
import { buildContactActions } from '@/utils/contactActions'
import { externalLinkProps, mapsHref } from '@/utils/contactLinks'

/** One-tap contact actions; only configured channels are shown. */
export function ContactActions({ profile }: { profile: ProfileDto }) {
  const actions = buildContactActions(profile)

  return (
    <nav aria-label="Contact actions" className="flex flex-col gap-3">
      <ul
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(actions.length, 4)}, minmax(0, 1fr))` }}
      >
        {actions.map((action) => (
          <li key={action.key}>
            <a
              href={action.href}
              aria-label={action.description}
              {...(action.external ? externalLinkProps : {})}
              className="group flex flex-col items-center gap-2 rounded-2xl py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105 group-active:scale-95">
                <action.icon aria-hidden="true" className="size-5" />
              </span>
              {action.label}
            </a>
          </li>
        ))}
      </ul>
      {profile.location ? (
        <a
          href={mapsHref(profile.location)}
          {...externalLinkProps}
          aria-label={`Open ${profile.location} in maps`}
          className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm transition-colors hover:bg-accent"
        >
          <MapPin aria-hidden="true" className="size-4 text-highlight" />
          <span className="flex-1">{profile.location}</span>
          <span className="text-xs text-muted-foreground">Open in Maps</span>
        </a>
      ) : null}
    </nav>
  )
}
