import {
  Accessibility,
  Film,
  FlaskConical,
  Gauge,
  Search,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

/** Report sections in page order: one source for section icons and the rail navigator. */
export const SECTION_META: Record<string, { label: string; icon: LucideIcon }> = {
  scores: { label: 'Scores', icon: Gauge },
  field: { label: 'Real visitors', icon: Users },
  lab: { label: 'Lab test', icon: FlaskConical },
  filmstrip: { label: 'How it loaded', icon: Film },
  opportunities: { label: 'What to fix first', icon: Wrench },
  'cat-accessibility': { label: 'Accessibility', icon: Accessibility },
  'cat-best-practices': { label: 'Best practices', icon: ShieldCheck },
  'cat-seo': { label: 'SEO', icon: Search },
}
