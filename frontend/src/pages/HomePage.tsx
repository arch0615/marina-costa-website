import { ContactPrefillProvider } from '@/components/contact/ContactPrefill'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useProfile } from '@/hooks/useSiteData'
import { AboutSection } from '@/sections/home/AboutSection'
import { ContactSection } from '@/sections/home/ContactSection'
import { HeroSection } from '@/sections/home/HeroSection'
import { PortfolioSection } from '@/sections/home/PortfolioSection'
import { ServicesSection } from '@/sections/home/ServicesSection'
import { TestimonialsSection } from '@/sections/home/TestimonialsSection'

export default function HomePage() {
  const { data: profile } = useProfile()

  useDocumentMeta({
    title: profile ? `${profile.fullName} — ${profile.professionalTitle}` : undefined,
    description: profile?.headline,
    path: '/',
  })

  return (
    <ContactPrefillProvider>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <PortfolioSection />
      <TestimonialsSection />
      <ContactSection />
    </ContactPrefillProvider>
  )
}
