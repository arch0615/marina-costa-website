import type { PortfolioItemDto, ProfileDto, ServiceDto, TestimonialDto } from '@/types'

export const profileFixture: ProfileDto = {
  id: 'profile-1',
  fullName: 'Marina Costa',
  professionalTitle: 'Brand & Digital Product Designer',
  companyName: 'Costa Studio',
  headline: 'I help growing companies turn complex ideas into clear brands.',
  biography: 'First paragraph about Marina.\n\nSecond paragraph about her work.',
  profileImage: '/images/profile/marina-costa.webp',
  email: 'marina@example.com',
  phone: '+1 212 555 0148',
  whatsapp: '+1 212 555 0148',
  website: 'https://costa.example',
  location: 'New York, NY',
  skills: ['Brand strategy', 'Figma'],
  socialLinks: [
    { id: 's1', platform: 'LINKEDIN', url: 'https://www.linkedin.com/in/marina' },
    { id: 's2', platform: 'INSTAGRAM', url: 'https://www.instagram.com/marina' },
  ],
  experience: [
    {
      id: 'e1',
      role: 'Founder',
      organization: 'Costa Studio',
      startDate: '2015-01-01',
      endDate: null,
      description: 'Independent studio.',
    },
  ],
  qualifications: [
    { id: 'q1', title: 'B.A. in Graphic Design', institution: 'Hudson School', year: 2013 },
  ],
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const servicesFixture: ServiceDto[] = [
  { id: 'sv1', title: 'Brand Identity', description: 'Logos and guidelines.', icon: 'palette' },
  {
    id: 'sv2',
    title: 'Website Design',
    description: 'Responsive websites.',
    icon: 'monitor-smartphone',
  },
]

export const portfolioFixture: PortfolioItemDto[] = [
  {
    id: 'p1',
    title: 'Lumen Bank',
    description: 'Mobile banking app.',
    image: '/images/portfolio/lumen-bank.svg',
    projectUrl: 'https://example.com/lumen',
    category: 'Product Design',
    technologies: ['Figma'],
    isFeatured: true,
  },
  {
    id: 'p2',
    title: 'Atlas Logistics',
    description: 'Brand identity.',
    image: null,
    projectUrl: null,
    category: 'Branding',
    technologies: [],
    isFeatured: false,
  },
]

export const testimonialsFixture: TestimonialDto[] = [
  {
    id: 't1',
    authorName: 'Daniel Reyes',
    authorRole: 'Head of Product',
    authorCompany: 'Lumen Bank',
    authorImage: null,
    quote: 'Marina transformed how our customers see us.',
  },
]
