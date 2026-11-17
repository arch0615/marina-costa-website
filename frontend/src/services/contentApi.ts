import type { PortfolioItemDto, ProfileDto, ServiceDto, TestimonialDto } from '@/types'
import { apiRequest } from './apiClient'

export const contentApi = {
  getProfile: () => apiRequest<ProfileDto>('/profile'),
  getServices: () => apiRequest<ServiceDto[]>('/services'),
  getPortfolio: () => apiRequest<PortfolioItemDto[]>('/portfolio'),
  getTestimonials: () => apiRequest<TestimonialDto[]>('/testimonials'),
}
