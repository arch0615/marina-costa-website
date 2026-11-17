import { Building2, MapPin } from 'lucide-react'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import type { ProfileDto } from '@/types'

export function CardProfileHeader({ profile }: { profile: ProfileDto }) {
  return (
    <header className="relative">
      <div
        aria-hidden="true"
        className="h-32 bg-primary bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.14)_1px,transparent_0)] [background-size:18px_18px]"
      />
      <div className="flex flex-col items-center px-6 text-center">
        <ProfileAvatar
          name={profile.fullName}
          src={profile.profileImage}
          width={224}
          height={224}
          priority
          className="-mt-16 size-32 rounded-full border-4 border-card bg-secondary text-4xl shadow-lift"
        />
        <h1 className="mt-5 text-[2rem] leading-tight font-medium">{profile.fullName}</h1>
        <p className="mt-1.5 text-[0.9375rem] font-medium text-highlight">
          {profile.professionalTitle}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {profile.companyName ? (
            <span className="inline-flex items-center gap-1.5">
              <Building2 aria-hidden="true" className="size-4" />
              {profile.companyName}
            </span>
          ) : null}
          {profile.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="size-4" />
              {profile.location}
            </span>
          ) : null}
        </div>
        <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
          {profile.headline}
        </p>
      </div>
    </header>
  )
}
