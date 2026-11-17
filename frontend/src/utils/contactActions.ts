import { Globe, Mail, MessageCircle, Phone, type LucideIcon } from 'lucide-react'
import type { ProfileDto } from '@/types'
import { emailHref, phoneHref, safeExternalUrl, whatsappHref } from './contactLinks'

export interface Action {
  key: string
  label: string
  description: string
  href: string
  icon: LucideIcon
  external: boolean
}

/** Contact actions for the digital card; channels that are not configured are omitted. */
export function buildContactActions(profile: ProfileDto): Action[] {
  const firstName = profile.fullName.split(' ')[0] ?? profile.fullName
  const website = safeExternalUrl(profile.website)
  const actions: (Action | null)[] = [
    profile.phone
      ? {
          key: 'call',
          label: 'Call',
          description: `Call ${profile.fullName}`,
          href: phoneHref(profile.phone),
          icon: Phone,
          external: false,
        }
      : null,
    {
      key: 'email',
      label: 'Email',
      description: `Email ${profile.fullName}`,
      href: emailHref(profile.email),
      icon: Mail,
      external: false,
    },
    profile.whatsapp
      ? {
          key: 'whatsapp',
          label: 'WhatsApp',
          description: `Message ${profile.fullName} on WhatsApp`,
          href: whatsappHref(
            profile.whatsapp,
            `Hi ${firstName}, I got your contact from your digital card.`,
          ),
          icon: MessageCircle,
          external: true,
        }
      : null,
    website
      ? {
          key: 'website',
          label: 'Website',
          description: `Visit ${profile.fullName}'s website`,
          href: website,
          icon: Globe,
          external: true,
        }
      : null,
  ]
  return actions.filter((action): action is Action => action !== null)
}
