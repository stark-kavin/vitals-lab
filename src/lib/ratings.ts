export type Rating = 'good' | 'needs-work' | 'poor'

export const RATING_LABEL: Record<Rating, string> = {
  good: 'Good',
  'needs-work': 'Needs work',
  poor: 'Poor',
}

export type MetricId = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB' | 'TBT' | 'SI' | 'TTI'

/** `good` is inclusive (value <= good), `poor` is exclusive (value > poor). */
export interface Threshold {
  good: number
  poor: number
  unit: 'ms' | 'unitless'
}

export const METRIC_THRESHOLDS: Record<MetricId, Threshold> = {
  LCP: { good: 2500, poor: 4000, unit: 'ms' },
  INP: { good: 200, poor: 500, unit: 'ms' },
  CLS: { good: 0.1, poor: 0.25, unit: 'unitless' },
  FCP: { good: 1800, poor: 3000, unit: 'ms' },
  TTFB: { good: 800, poor: 1800, unit: 'ms' },
  TBT: { good: 200, poor: 600, unit: 'ms' },
  SI: { good: 3400, poor: 5800, unit: 'ms' },
  // Lighthouse's own TTI curve (p10 3785 ms, median 7300 ms).
  TTI: { good: 3800, poor: 7300, unit: 'ms' },
}

export function rateMetric(id: MetricId, value: number | null | undefined): Rating | null {
  if (value == null || !Number.isFinite(value)) return null
  const t = METRIC_THRESHOLDS[id]
  if (value <= t.good) return 'good'
  if (value > t.poor) return 'poor'
  return 'needs-work'
}

/** Rate a 0-100 category score. */
export function rateScore(score: number | null | undefined): Rating | null {
  if (score == null || !Number.isFinite(score)) return null
  if (score >= 90) return 'good'
  if (score >= 50) return 'needs-work'
  return 'poor'
}

/** Lighthouse 0-1 score to a rounded 0-100 integer. */
export function toScore100(score: number | null | undefined): number | null {
  if (score == null || !Number.isFinite(score)) return null
  return Math.round(score * 100)
}

/** Rate an individual audit from its 0-1 score. */
export function rateAuditScore(score: number | null | undefined): Rating | null {
  return rateScore(toScore100(score))
}

/** CrUX buckets (FAST / AVERAGE / SLOW) mapped onto our rating vocabulary. */
export function rateCruxCategory(category: string | null | undefined): Rating | null {
  switch (category) {
    case 'FAST':
      return 'good'
    case 'AVERAGE':
      return 'needs-work'
    case 'SLOW':
      return 'poor'
    default:
      return null
  }
}
