import type { LoadingExperience } from './psi-types'
import { rateCruxCategory, rateMetric, type MetricId, type Rating } from './ratings'

export type FieldMetricId = Extract<MetricId, 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB'>

/** CrUX keys in display order. INP, LCP and CLS are the Core Web Vitals. */
export const CRUX_KEYS: { id: FieldMetricId; key: string; core: boolean }[] = [
  { id: 'LCP', key: 'LARGEST_CONTENTFUL_PAINT_MS', core: true },
  { id: 'INP', key: 'INTERACTION_TO_NEXT_PAINT', core: true },
  { id: 'CLS', key: 'CUMULATIVE_LAYOUT_SHIFT_SCORE', core: true },
  { id: 'FCP', key: 'FIRST_CONTENTFUL_PAINT_MS', core: false },
  { id: 'TTFB', key: 'EXPERIMENTAL_TIME_TO_FIRST_BYTE', core: false },
]

export interface FieldMetric {
  id: FieldMetricId
  core: boolean
  /** p75 in ms, or unitless for CLS (already divided by 100). */
  p75: number
  rating: Rating | null
  /** Shares of page loads that were good / needs improvement / poor; sum ~ 1. */
  distribution: { good: number; needsWork: number; poor: number }
}

export interface FieldData {
  overall: Rating | null
  metrics: FieldMetric[]
  /** Core Web Vitals assessment: passed only when all present core metrics are good. */
  coreWebVitals: 'passed' | 'failed' | 'unknown'
}

export function parseCrux(le: LoadingExperience | null | undefined): FieldData | null {
  const raw = le?.metrics
  if (!raw) return null

  const metrics: FieldMetric[] = []
  for (const { id, key, core } of CRUX_KEYS) {
    const m = raw[key]
    if (!m || typeof m.percentile !== 'number') continue
    const p75 = id === 'CLS' ? m.percentile / 100 : m.percentile
    const d = m.distributions ?? []
    metrics.push({
      id,
      core,
      p75,
      // Prefer our thresholds so the rating matches the numbers we show.
      rating: rateMetric(id, p75) ?? rateCruxCategory(m.category),
      distribution: {
        good: d[0]?.proportion ?? 0,
        needsWork: d[1]?.proportion ?? 0,
        poor: d[2]?.proportion ?? 0,
      },
    })
  }
  if (metrics.length === 0) return null

  const core = metrics.filter((m) => m.core)
  // CWV needs LCP and CLS at minimum; INP may be missing on low-interaction pages.
  const hasRequired = core.some((m) => m.id === 'LCP') && core.some((m) => m.id === 'CLS')
  const coreWebVitals = !hasRequired
    ? 'unknown'
    : core.every((m) => m.rating === 'good')
      ? 'passed'
      : 'failed'

  return { overall: rateCruxCategory(le?.overall_category), metrics, coreWebVitals }
}
