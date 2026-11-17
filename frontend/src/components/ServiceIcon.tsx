import {
  Component,
  LayoutDashboard,
  MessagesSquare,
  MonitorSmartphone,
  Palette,
  PenTool,
  ScanSearch,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

/**
 * Curated icon set for services. Only these icons are bundled (instead of the whole
 * Lucide library); unknown names fall back to a neutral icon.
 */
const ICONS: Record<string, LucideIcon> = {
  palette: Palette,
  'monitor-smartphone': MonitorSmartphone,
  'layout-dashboard': LayoutDashboard,
  component: Component,
  'scan-search': ScanSearch,
  'messages-square': MessagesSquare,
  'pen-tool': PenTool,
}

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles
  return <Icon aria-hidden="true" className={className} strokeWidth={1.6} />
}
