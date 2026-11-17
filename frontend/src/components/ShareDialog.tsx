import { Check, Copy, Mail, MessageCircle } from 'lucide-react'
import { useId } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import type { SharePayload } from '@/hooks/useShare'
import { emailHref, externalLinkProps, whatsappShareHref } from '@/utils/contactLinks'
import { SocialIcon } from './SocialIcon'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payload: SharePayload
}

/** Fallback sharing options for browsers without the Web Share API. */
export function ShareDialog({ open, onOpenChange, payload }: ShareDialogProps) {
  const inputId = useId()
  const { copied, copy } = useCopyToClipboard()
  const message = `${payload.text} ${payload.url}`

  const handleCopy = async () => {
    const ok = await copy(payload.url)
    if (ok) toast.success('Link copied to clipboard')
    else toast.error('Could not copy the link. Please copy it manually.')
  }

  const options = [
    {
      label: 'WhatsApp',
      href: whatsappShareHref(message),
      icon: <MessageCircle aria-hidden="true" className="size-5" />,
      external: true,
    },
    {
      label: 'Email',
      href: emailHref('', { subject: payload.title, body: message }),
      icon: <Mail aria-hidden="true" className="size-5" />,
      external: false,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(payload.url)}`,
      icon: <SocialIcon platform="LINKEDIN" className="size-[1.1rem]" />,
      external: true,
    },
    {
      label: 'X',
      href: `https://x.com/intent/post?text=${encodeURIComponent(payload.text)}&url=${encodeURIComponent(payload.url)}`,
      icon: <SocialIcon platform="X" className="size-[1.05rem]" />,
      external: true,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-medium">Share</DialogTitle>
          <DialogDescription>
            Send this link to anyone who should have my details.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-sm font-medium">
            Link
          </label>
          <div className="flex gap-2">
            <Input
              id={inputId}
              readOnly
              value={payload.url}
              onFocus={(event) => event.currentTarget.select()}
              className="font-mono text-sm"
            />
            <Button onClick={handleCopy} variant="default" className="shrink-0" aria-live="polite">
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-2" aria-label="Share via">
          {options.map((option) => (
            <li key={option.label}>
              <a
                href={option.href}
                {...(option.external ? externalLinkProps : {})}
                className="flex h-12 items-center gap-3 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-accent"
              >
                {option.icon}
                {option.label}
              </a>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
