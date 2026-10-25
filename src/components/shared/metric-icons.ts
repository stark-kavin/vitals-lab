import {
  Eye,
  Hand,
  Hourglass,
  Image,
  MousePointerClick,
  Move,
  Paintbrush,
  Server,
  type LucideIcon,
} from 'lucide-react'
import type { MetricId } from '@/lib/ratings'

/** One recognisable glyph per metric, reused by lab and field rows. */
export const METRIC_ICON: Record<MetricId, LucideIcon> = {
  FCP: Paintbrush,
  LCP: Image,
  TBT: Hourglass,
  CLS: Move,
  SI: Eye,
  TTI: Hand,
  INP: MousePointerClick,
  TTFB: Server,
}
