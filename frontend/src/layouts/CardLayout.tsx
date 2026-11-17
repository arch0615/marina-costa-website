import type { ReactNode } from 'react'

/** Mobile-first shell for the digital card: edge-to-edge on phones, floating card on larger screens. */
export function CardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-card sm:bg-background sm:px-6 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 hidden h-80 bg-[radial-gradient(circle_at_1px_1px,rgb(28_43_74/0.10)_1px,transparent_0)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent)] sm:block"
      />
      <main id="main" className="relative">
        {children}
      </main>
    </div>
  )
}
