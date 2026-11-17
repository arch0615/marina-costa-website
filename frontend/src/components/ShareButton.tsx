import { Share2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { useShare, type SharePayload } from '@/hooks/useShare'
import { ShareDialog } from './ShareDialog'

interface ShareButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  payload: SharePayload
  label?: string
}

/** Native share sheet where supported, with an in-page fallback dialog otherwise. */
export function ShareButton({ payload, label = 'Share', ...buttonProps }: ShareButtonProps) {
  const { share, fallbackOpen, setFallbackOpen } = useShare()

  return (
    <>
      <Button {...buttonProps} onClick={() => void share(payload)}>
        <Share2 aria-hidden="true" />
        {label}
      </Button>
      <ShareDialog open={fallbackOpen} onOpenChange={setFallbackOpen} payload={payload} />
    </>
  )
}
