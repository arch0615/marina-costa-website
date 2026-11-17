import { UserPlus } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { QrCodePanel } from '@/components/QrCodePanel'
import { ShareButton } from '@/components/ShareButton'
import { SocialLinks } from '@/components/SocialLinks'
import { ErrorState, LoadingRegion, Skeleton } from '@/components/StatusViews'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useProfile } from '@/hooks/useSiteData'
import { CardLayout } from '@/layouts/CardLayout'
import { CardProfileHeader } from '@/sections/card/CardProfileHeader'
import { ContactActions } from '@/sections/card/ContactActions'
import { FeaturedProjects } from '@/sections/card/FeaturedProjects'
import { toSlug } from '@/utils/format'
import { getCardUrl, VCARD_URL } from '@/utils/siteConfig'

function CardSkeleton() {
  return (
    <LoadingRegion label="Loading digital card">
      <Skeleton className="h-32 rounded-none" />
      <div className="flex flex-col items-center gap-4 px-6 pb-10">
        <Skeleton className="-mt-16 size-32 rounded-full border-4 border-card" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full" />
        <div className="grid w-full grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="mx-auto size-12 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </LoadingRegion>
  )
}

export default function CardPage() {
  const { status, data: profile, retry } = useProfile()
  const cardUrl = getCardUrl()

  useDocumentMeta({
    title: profile ? `${profile.fullName} · Digital Business Card` : undefined,
    description: profile
      ? `${profile.professionalTitle}${profile.companyName ? ` at ${profile.companyName}` : ''}. Save my contact or get in touch in one tap.`
      : undefined,
    path: '/card',
  })

  return (
    <CardLayout>
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-[440px] overflow-hidden bg-card sm:rounded-[2rem] sm:border sm:border-border sm:shadow-lift"
      >
        {status === 'loading' ? <CardSkeleton /> : null}
        {status === 'error' ? (
          <div className="p-6">
            <ErrorState message="The card could not be loaded." onRetry={retry} />
          </div>
        ) : null}

        {profile ? (
          <>
            <CardProfileHeader profile={profile} />

            <div className="flex flex-col gap-8 px-5 pt-7 pb-8 sm:px-7">
              <ContactActions profile={profile} />

              <div className="flex flex-col gap-2 min-[360px]:flex-row">
                <Button asChild size="lg" className="flex-1">
                  <a href={VCARD_URL} download={`${toSlug(profile.fullName)}.vcf`}>
                    <UserPlus aria-hidden="true" />
                    Save contact
                  </a>
                </Button>
                <ShareButton
                  variant="outline"
                  size="lg"
                  payload={{
                    title: `${profile.fullName} · Digital Business Card`,
                    text: `${profile.fullName} — ${profile.professionalTitle}`,
                    url: cardUrl,
                  }}
                />
              </div>

              {profile.socialLinks.length > 0 ? (
                <section
                  aria-labelledby="card-social-title"
                  className="flex flex-col items-center gap-3"
                >
                  <h2
                    id="card-social-title"
                    className="font-sans text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase"
                  >
                    Follow
                  </h2>
                  <SocialLinks
                    links={profile.socialLinks}
                    ownerName={profile.fullName}
                    variant="soft"
                    className="justify-center"
                  />
                </section>
              ) : null}

              <Separator />
              <FeaturedProjects />
              <Separator />

              <section aria-labelledby="card-qr-title" className="flex flex-col items-center gap-5">
                <h2 id="card-qr-title" className="text-xl font-medium">
                  Scan to connect
                </h2>
                <QrCodePanel url={cardUrl} fileBaseName={`${toSlug(profile.fullName)}-card`} />
              </section>
            </div>

            <footer className="flex items-center justify-between gap-4 border-t border-border px-6 py-5 text-xs text-muted-foreground">
              <Link
                to="/"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Visit full website
              </Link>
              <span>
                © {new Date().getFullYear()} {profile.companyName ?? profile.fullName}
              </span>
            </footer>
          </>
        ) : null}
      </motion.article>
    </CardLayout>
  )
}
