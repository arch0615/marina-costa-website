import { Link } from 'react-router'
import { Container } from '@/components/Container'
import { Button } from '@/components/ui/button'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function NotFoundPage() {
  useDocumentMeta({ title: 'Page not found', noindex: true })

  return (
    <section aria-labelledby="not-found-title" className="py-section">
      <Container className="flex flex-col items-center text-center">
        <p className="font-display text-7xl text-highlight">404</p>
        <h1 id="not-found-title" className="mt-4 text-heading font-medium">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          The link may be outdated or mistyped. Here are some places to continue.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">Go to homepage</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/card">Open digital card</Link>
          </Button>
        </div>
      </Container>
    </section>
  )
}
