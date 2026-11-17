import { contentApi } from '@/services/contentApi'
import { useResource } from './useResource'

export const useProfile = () => useResource('profile', contentApi.getProfile)
export const useServices = () => useResource('services', contentApi.getServices)
export const usePortfolio = () => useResource('portfolio', contentApi.getPortfolio)
export const useTestimonials = () => useResource('testimonials', contentApi.getTestimonials)
