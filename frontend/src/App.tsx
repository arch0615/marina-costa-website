import { MotionConfig } from 'motion/react'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { ScrollManager } from '@/components/ScrollManager'
import { Toaster } from '@/components/ui/sonner'
import { SiteLayout } from '@/layouts/SiteLayout'

// Route-level code splitting: each page ships its own bundle.
const HomePage = lazy(() => import('@/pages/HomePage'))
const CardPage = lazy(() => import('@/pages/CardPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function PageFallback() {
  return <div role="status" aria-label="Loading page" className="min-h-dvh" />
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/card" element={<CardPage />} />
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ScrollManager />
        <AppRoutes />
      </BrowserRouter>
      <Toaster position="top-center" />
    </MotionConfig>
  )
}
