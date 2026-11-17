import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface ContactPrefillValue {
  subject: string | null
  /** Pre-fills the contact form subject (e.g. from a service card). */
  prefillSubject: (subject: string) => void
}

const ContactPrefillContext = createContext<ContactPrefillValue | null>(null)

export function ContactPrefillProvider({ children }: { children: ReactNode }) {
  const [subject, setSubject] = useState<string | null>(null)
  const value = useMemo(() => ({ subject, prefillSubject: setSubject }), [subject])
  return <ContactPrefillContext.Provider value={value}>{children}</ContactPrefillContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useContactPrefill(): ContactPrefillValue {
  return useContext(ContactPrefillContext) ?? { subject: null, prefillSubject: () => undefined }
}
