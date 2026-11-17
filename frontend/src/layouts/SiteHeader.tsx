import { IdCard, Menu } from 'lucide-react'
import { Link } from 'react-router'
import { Container } from '@/components/Container'
import { Logo } from '@/components/Logo'
import { SocialLinks } from '@/components/SocialLinks'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useScrolled } from '@/hooks/useScrolled'
import { useProfile } from '@/hooks/useSiteData'
import { cn } from '@/utils/cn'
import { SECTION_LINKS } from '@/utils/siteConfig'

const NAV_LINKS = SECTION_LINKS.filter((link) => link.id !== 'testimonials')
const SECTION_IDS = SECTION_LINKS.map((link) => link.id)

export function SiteHeader() {
  const profile = useProfile()
  const scrolled = useScrolled()
  const active = useActiveSection(SECTION_IDS)
  const name = profile.data?.fullName

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled
          ? 'border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70'
          : 'border-transparent bg-background',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
        <Logo name={name} />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={`/#${link.id}`}
                  aria-current={active === link.id ? 'location' : undefined}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                    'aria-[current=location]:text-foreground',
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link to="/card">
              <IdCard aria-hidden="true" />
              Digital card
            </Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <a href="/#contact">Contact me</a>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" className="lg:hidden" aria-label="Open menu">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,100vw)] gap-0 bg-background p-0">
              <SheetHeader className="border-b border-border px-6 py-5">
                <SheetTitle className="font-display text-xl font-medium">Menu</SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="flex flex-col">
                  {SECTION_LINKS.map((link) => (
                    <li key={link.id}>
                      <SheetClose asChild>
                        <a
                          href={`/#${link.id}`}
                          className="flex h-12 items-center rounded-xl px-3 font-display text-xl text-foreground transition-colors hover:bg-accent"
                        >
                          {link.label}
                        </a>
                      </SheetClose>
                    </li>
                  ))}
                  <li>
                    <SheetClose asChild>
                      <Link
                        to="/card"
                        className="flex h-12 items-center gap-2 rounded-xl px-3 font-display text-xl text-foreground transition-colors hover:bg-accent"
                      >
                        Digital card
                      </Link>
                    </SheetClose>
                  </li>
                </ul>
              </nav>
              <div className="flex flex-col gap-4 border-t border-border px-6 py-6">
                <SheetClose asChild>
                  <Button asChild size="lg" className="w-full">
                    <a href="/#contact">Contact me</a>
                  </Button>
                </SheetClose>
                {profile.data ? (
                  <SocialLinks links={profile.data.socialLinks} ownerName={profile.data.fullName} />
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  )
}
