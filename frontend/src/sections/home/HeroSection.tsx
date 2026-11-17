import { ArrowRight, MapPin } from 'lucide-react'
import { motion } from 'motion/react'
import { Container } from '@/components/Container'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import { SocialLinks } from '@/components/SocialLinks'
import { ErrorState, LoadingRegion, Skeleton } from '@/components/StatusViews'
import { Button } from '@/components/ui/button'
import { useProfile } from '@/hooks/useSiteData'
import { yearsOfExperience } from '@/utils/format'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
})

function HeroSkeleton() {
  return (
    <LoadingRegion
      label="Loading profile"
      className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]"
    >
      <div className="flex flex-col gap-5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-16 w-full max-w-lg" />
        <Skeleton className="h-6 w-full max-w-xl" />
        <Skeleton className="h-6 w-4/5 max-w-lg" />
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-12 w-40 rounded-full" />
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
      </div>
      <Skeleton className="mx-auto aspect-[4/5] w-full max-w-[19rem] rounded-[2rem] sm:max-w-sm" />
    </LoadingRegion>
  )
}

export function HeroSection() {
  const { status, data: profile, retry } = useProfile()
  const years = profile ? yearsOfExperience(profile.experience) : null

  return (
    <section aria-labelledby="hero-title" className="relative pt-8 pb-section md:pt-14">
      <Container>
        {status === 'loading' ? <HeroSkeleton /> : null}
        {status === 'error' ? (
          <ErrorState message="The profile could not be loaded." onRetry={retry} />
        ) : null}

        {profile ? (
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            <div>
              <motion.p
                {...fadeUp(0)}
                className="mb-6 inline-flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-highlight uppercase"
              >
                <span aria-hidden="true" className="h-px w-8 bg-highlight/60" />
                {profile.professionalTitle}
              </motion.p>
              <motion.h1 {...fadeUp(0.06)} id="hero-title" className="text-display font-medium">
                {profile.fullName}
              </motion.h1>
              <motion.p {...fadeUp(0.12)} className="mt-7 max-w-xl text-lead text-muted-foreground">
                {profile.headline}
              </motion.p>

              <motion.div
                {...fadeUp(0.18)}
                className="mt-10 flex flex-col gap-3 min-[420px]:flex-row"
              >
                <Button asChild size="lg">
                  <a href="#contact">
                    Contact me
                    <ArrowRight aria-hidden="true" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#portfolio">View portfolio</a>
                </Button>
              </motion.div>

              <motion.div
                {...fadeUp(0.24)}
                className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-border pt-8"
              >
                <SocialLinks links={profile.socialLinks} ownerName={profile.fullName} />
                {profile.location ? (
                  <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin aria-hidden="true" className="size-4" />
                    {profile.location}
                  </p>
                ) : null}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-[19rem] sm:max-w-sm lg:max-w-none"
            >
              <div
                aria-hidden="true"
                className="absolute -inset-3 -z-10 hidden translate-x-4 translate-y-4 rounded-[2.25rem] border border-highlight/25 sm:block"
              />
              <ProfileAvatar
                name={profile.fullName}
                src={profile.profileImage}
                width={720}
                height={900}
                priority
                className="aspect-[4/5] w-full rounded-[2rem] bg-secondary text-8xl shadow-lift"
              />
              {years ? (
                <div className="absolute -bottom-5 -left-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-lift sm:-left-6">
                  <p className="font-display text-3xl leading-none font-medium">{years}+</p>
                  <p className="mt-1 text-xs text-muted-foreground">years of experience</p>
                </div>
              ) : null}
              {profile.companyName ? (
                <div className="absolute top-5 -right-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-lift sm:-right-5">
                  {profile.companyName}
                </div>
              ) : null}
            </motion.div>
          </div>
        ) : null}
      </Container>
    </section>
  )
}
