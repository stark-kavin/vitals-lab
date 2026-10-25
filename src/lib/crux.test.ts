import { describe, expect, it } from 'vitest'
import { parseCrux } from './crux'

const dist = (g: number, n: number) => [
  { min: 0, max: 1, proportion: g },
  { min: 1, max: 2, proportion: n },
  { min: 2, proportion: 1 - g - n },
]

describe('parseCrux', () => {
  it('returns null when there is no field data', () => {
    expect(parseCrux(null)).toBeNull()
    expect(parseCrux({ id: 'x' })).toBeNull()
    expect(parseCrux({ metrics: {} })).toBeNull()
  })

  it('divides the CLS percentile by 100', () => {
    const d = parseCrux({
      metrics: {
        CUMULATIVE_LAYOUT_SHIFT_SCORE: {
          percentile: 12,
          distributions: dist(0.7, 0.2),
          category: 'AVERAGE',
        },
      },
    })
    expect(d?.metrics[0]).toMatchObject({ id: 'CLS', p75: 0.12, rating: 'needs-work' })
    expect(d?.metrics[0]?.distribution.poor).toBeCloseTo(0.1)
  })

  it('skips missing metrics and keeps display order', () => {
    const d = parseCrux({
      overall_category: 'FAST',
      metrics: {
        FIRST_CONTENTFUL_PAINT_MS: { percentile: 1200, distributions: dist(0.9, 0.05) },
        LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2000, distributions: dist(0.8, 0.1) },
        INTERACTION_TO_NEXT_PAINT: { distributions: dist(0.8, 0.1) },
      },
    })
    expect(d?.metrics.map((m) => m.id)).toEqual(['LCP', 'FCP'])
    expect(d?.overall).toBe('good')
    // No CLS, so Core Web Vitals can't be assessed.
    expect(d?.coreWebVitals).toBe('unknown')
  })

  it('assesses Core Web Vitals', () => {
    const base = {
      LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2000, distributions: dist(0.8, 0.1) },
      CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 5, distributions: dist(0.9, 0.05) },
    }
    expect(parseCrux({ metrics: base })?.coreWebVitals).toBe('passed')
    const slowInp = {
      ...base,
      INTERACTION_TO_NEXT_PAINT: { percentile: 350, distributions: dist(0.6, 0.3) },
    }
    expect(parseCrux({ metrics: slowInp })?.coreWebVitals).toBe('failed')
  })

  it('tolerates missing distributions', () => {
    const d = parseCrux({ metrics: { EXPERIMENTAL_TIME_TO_FIRST_BYTE: { percentile: 900 } } })
    expect(d?.metrics[0]).toMatchObject({
      id: 'TTFB',
      rating: 'needs-work',
      distribution: { good: 0, needsWork: 0, poor: 0 },
    })
  })
})
