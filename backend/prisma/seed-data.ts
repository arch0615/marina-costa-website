/**
 * Initial content for the website and digital business card.
 *
 * ── DEMO CONTENT ────────────────────────────────────────────────────────────
 * Everything below describes a fictional professional. Replace it with real
 * details and run `pnpm db:seed` again — the seed is idempotent: it updates the
 * profile in place and replaces its services, projects, links and testimonials.
 *   • Phone numbers use the 555-01xx range reserved for fictional use.
 *   • example.com addresses/links are reserved domains that are safe for demos.
 * ────────────────────────────────────────────────────────────────────────────
 */
import type { PrismaClient, SocialPlatform } from '../src/generated/prisma/client.js'

export const DEFAULT_PROFILE_SLUG = 'default'

export function buildSeedData(publicSiteUrl: string) {
  return {
    profile: {
      fullName: 'Marina Costa',
      professionalTitle: 'Brand & Digital Product Designer',
      companyName: 'Costa Studio',
      headline:
        'I help growing companies turn complex ideas into clear brands and digital products that people genuinely enjoy using.',
      biography: [
        "I'm an independent designer based in New York with more than ten years of experience shaping brands, websites and digital products for startups, agencies and established companies.",
        'My work sits where strategy, design and technology meet. I start every project by understanding the business and the people it serves, then turn those insights into identities, interfaces and design systems that are consistent, accessible and built to scale.',
        'Before founding Costa Studio, I led product design at a fintech scale-up and worked at a branding agency — experience that taught me how to keep ambitious projects on schedule without compromising on craft.',
      ].join('\n\n'),
      profileImage: '/images/profile/marina-costa.webp',
      email: 'marina@example.com',
      phone: '+1 212 555 0148',
      whatsapp: '+1 212 555 0148',
      website: publicSiteUrl,
      location: 'New York, NY',
      skills: [
        'Brand strategy',
        'Visual identity',
        'UI design',
        'UX research',
        'Design systems',
        'Prototyping',
        'Accessibility (WCAG 2.2)',
        'Figma',
        'Webflow',
        'HTML & CSS',
      ],
    },

    socialLinks: [
      { platform: 'LINKEDIN', url: 'https://www.linkedin.com/' },
      { platform: 'INSTAGRAM', url: 'https://www.instagram.com/' },
      { platform: 'X', url: 'https://x.com/' },
      { platform: 'YOUTUBE', url: 'https://www.youtube.com/' },
      // Facebook is intentionally not configured to demonstrate that only configured networks render.
    ] satisfies { platform: SocialPlatform; url: string }[],

    services: [
      {
        title: 'Brand Identity',
        icon: 'palette',
        description:
          'Strategic visual identities — logo, typography, color and usage guidelines — that make your company instantly recognizable.',
      },
      {
        title: 'Website Design',
        icon: 'monitor-smartphone',
        description:
          'Responsive, conversion-focused websites designed around your audience and built to be easy for your team to maintain.',
      },
      {
        title: 'Product & UX Design',
        icon: 'layout-dashboard',
        description:
          'Research-driven interfaces for web and mobile apps, from early wireframes to polished, testable prototypes.',
      },
      {
        title: 'Design Systems',
        icon: 'component',
        description:
          'Reusable component libraries and clear documentation that keep designers and developers consistent and shipping faster.',
      },
      {
        title: 'UX & Accessibility Audit',
        icon: 'scan-search',
        description:
          "An expert review of your product's usability and accessibility, with a prioritized, practical list of improvements.",
      },
      {
        title: 'Design Workshops',
        icon: 'messages-square',
        description:
          'Hands-on workshops and ongoing advisory that help in-house teams sharpen their design process and decisions.',
      },
    ],

    portfolio: [
      {
        title: 'Lumen Bank',
        description:
          'A mobile banking app redesign that simplified everyday tasks and lifted the app-store rating from 3.6 to 4.8.',
        category: 'Product Design',
        technologies: ['Figma', 'iOS', 'Android', 'Design system'],
        image: '/images/portfolio/lumen-bank.svg',
        projectUrl: 'https://example.com/case-studies/lumen-bank',
        isFeatured: true,
      },
      {
        title: 'Verde Market',
        description:
          'An e-commerce redesign for an organic grocery brand, focused on faster checkout and clearer product discovery.',
        category: 'Web Design',
        technologies: ['Figma', 'Shopify', 'A/B testing'],
        image: '/images/portfolio/verde-market.svg',
        projectUrl: 'https://example.com/case-studies/verde-market',
        isFeatured: true,
      },
      {
        title: 'Atlas Logistics',
        description:
          'A complete brand identity for a freight-tech company, from naming workshop to logo, typography and guidelines.',
        category: 'Branding',
        technologies: ['Brand strategy', 'Logo design', 'Guidelines'],
        image: '/images/portfolio/atlas-logistics.svg',
        projectUrl: 'https://example.com/case-studies/atlas-logistics',
        isFeatured: false,
      },
      {
        title: 'Pulse Health',
        description:
          'A patient dashboard that brings appointments, results and messages together in one accessible interface.',
        category: 'Product Design',
        technologies: ['UX research', 'Prototyping', 'WCAG 2.2'],
        image: '/images/portfolio/pulse-health.svg',
        projectUrl: 'https://example.com/case-studies/pulse-health',
        isFeatured: true,
      },
      {
        title: 'Nord Coffee',
        description:
          'Packaging and visual identity for a specialty coffee roaster, inspired by Scandinavian minimalism.',
        category: 'Branding',
        technologies: ['Packaging', 'Illustration', 'Typography'],
        image: '/images/portfolio/nord-coffee.svg',
        projectUrl: 'https://example.com/case-studies/nord-coffee',
        isFeatured: false,
      },
      {
        title: 'Orbit Design System',
        description:
          'A multi-brand design system with 60+ components, tokens and documentation used by four product teams.',
        category: 'Design Systems',
        technologies: ['Figma', 'React', 'Storybook'],
        image: '/images/portfolio/orbit-design-system.svg',
        projectUrl: 'https://example.com/case-studies/orbit',
        isFeatured: false,
      },
    ],

    testimonials: [
      {
        authorName: 'Daniel Reyes',
        authorRole: 'Head of Product',
        authorCompany: 'Lumen Bank',
        quote:
          'Marina transformed how our customers see us. The new app launched on schedule, and our rating climbed from 3.6 to 4.8 within six months.',
      },
      {
        authorName: 'Priya Nair',
        authorRole: 'CTO',
        authorCompany: 'Orbit Labs',
        quote:
          'Working with Marina felt like adding a senior design lead to the team. She involved our developers early and delivered a design system we use every day.',
      },
      {
        authorName: 'Lucas Almeida',
        authorRole: 'Founder',
        authorCompany: 'Verde Market',
        quote:
          'Our store is cleaner, faster and converts better. Her process was clear from day one, and she was always just a message away.',
      },
    ],

    experience: [
      {
        role: 'Founder & Principal Designer',
        organization: 'Costa Studio',
        startDate: new Date('2019-03-01'),
        endDate: null,
        description:
          'Independent studio delivering brand and product design for startups and scale-ups across the Americas and Europe.',
      },
      {
        role: 'Product Design Lead',
        organization: 'Northwind Fintech',
        startDate: new Date('2016-01-01'),
        endDate: new Date('2019-02-28'),
        description:
          "Led a team of six designers and launched the company's first cross-platform design system.",
      },
      {
        role: 'Visual Designer',
        organization: 'Studio Kinetic',
        startDate: new Date('2013-06-01'),
        endDate: new Date('2015-12-31'),
        description:
          'Designed identities and websites for clients in retail, hospitality and culture.',
      },
    ],

    qualifications: [
      { title: 'B.A. in Graphic Design', institution: 'Hudson School of Art & Design', year: 2013 },
      {
        title: 'Postgraduate Certificate in UX Design',
        institution: 'Institute of Design Studies',
        year: 2016,
      },
      {
        title: 'Accessibility Specialist (WCAG 2.2)',
        institution: 'Accessibility Professional Program',
        year: 2022,
      },
    ],
  }
}

/**
 * Creates or updates the default profile and replaces all of its related content.
 * Contact submissions are never touched.
 */
export async function seedDatabase(db: PrismaClient, publicSiteUrl: string) {
  const data = buildSeedData(publicSiteUrl)
  const ordered = <T>(items: T[]) => items.map((item, index) => ({ ...item, displayOrder: index }))

  return db.$transaction(async (tx) => {
    const profile = await tx.profile.upsert({
      where: { slug: DEFAULT_PROFILE_SLUG },
      create: { slug: DEFAULT_PROFILE_SLUG, ...data.profile },
      update: data.profile,
    })
    const profileId = profile.id

    // Interactive transactions use a single connection, so run statements sequentially.
    await tx.service.deleteMany({ where: { profileId } })
    await tx.portfolioItem.deleteMany({ where: { profileId } })
    await tx.socialLink.deleteMany({ where: { profileId } })
    await tx.testimonial.deleteMany({ where: { profileId } })
    await tx.experience.deleteMany({ where: { profileId } })
    await tx.qualification.deleteMany({ where: { profileId } })

    const withProfile = <T>(items: T[]) => ordered(items).map((item) => ({ ...item, profileId }))

    await tx.service.createMany({ data: withProfile(data.services) })
    await tx.portfolioItem.createMany({ data: withProfile(data.portfolio) })
    await tx.socialLink.createMany({ data: withProfile(data.socialLinks) })
    await tx.testimonial.createMany({ data: withProfile(data.testimonials) })
    await tx.experience.createMany({ data: withProfile(data.experience) })
    await tx.qualification.createMany({ data: withProfile(data.qualifications) })

    return profile
  })
}
