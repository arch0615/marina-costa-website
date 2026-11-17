import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { Container } from '@/components/Container'
import { Logo } from '@/components/Logo'
import { SocialLinks } from '@/components/SocialLinks'
import { useProfile } from '@/hooks/useSiteData'
import { emailHref, phoneHref } from '@/utils/contactLinks'
import { SECTION_LINKS } from '@/utils/siteConfig'

export function SiteFooter() {
  const { data: profile } = useProfile()
  const year = new Date().getFullYear()
  const owner = profile?.companyName ?? profile?.fullName

  return (
    <footer className="bg-primary text-white">
      <Container className="grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <Logo name={profile?.fullName} tone="inverted" />
          {profile ? (
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
              {profile.professionalTitle}
              {profile.companyName ? ` · ${profile.companyName}` : ''}
              {profile.location ? ` · ${profile.location}` : ''}
            </p>
          ) : null}
          {profile ? (
            <SocialLinks
              links={profile.socialLinks}
              ownerName={profile.fullName}
              variant="inverted"
              className="mt-6"
            />
          ) : null}
        </div>

        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="font-sans text-xs font-semibold tracking-[0.16em] text-white/50 uppercase">
            Explore
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {SECTION_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={`/#${link.id}`}
                  className="text-white/80 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link to="/card" className="text-white/80 transition-colors hover:text-white">
                Digital business card
              </Link>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="font-sans text-xs font-semibold tracking-[0.16em] text-white/50 uppercase">
            Get in touch
          </h2>
          {profile ? (
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              <li>
                <a
                  href={emailHref(profile.email)}
                  className="inline-flex items-center gap-1 text-white/80 hover:text-white"
                >
                  {profile.email}
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </a>
              </li>
              {profile.phone ? (
                <li>
                  <a href={phoneHref(profile.phone)} className="text-white/80 hover:text-white">
                    {profile.phone}
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {owner}. All rights reserved.
          </p>
          <a href="/#top" className="hover:text-white">
            Back to top ↑
          </a>
        </Container>
      </div>
    </footer>
  )
}
