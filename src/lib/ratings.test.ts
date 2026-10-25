import { describe, expect, it } from 'vitest'
import { rateAuditScore, rateCruxCategory, rateMetric, rateScore, toScore100 } from './ratings'

describe('rateScore', () => {
  it.each([
    [100, 'good'],
    [90, 'good'],
    [89, 'needs-work'],
    [50, 'needs-work'],
    [49, 'poor'],
    [0, 'poor'],
    [null, null],
  ] as const)('%s -> %s', (score, rating) => expect(rateScore(score)).toBe(rating))
})

describe('rateMetric boundaries', () => {
  it.each([
    ['LCP', 2500, 'good'],
    ['LCP', 2501, 'needs-work'],
    ['LCP', 4000, 'needs-work'],
    ['LCP', 4001, 'poor'],
    ['INP', 200, 'good'],
    ['INP', 500, 'needs-work'],
    ['INP', 501, 'poor'],
    ['CLS', 0.1, 'good'],
    ['CLS', 0.25, 'needs-work'],
    ['CLS', 0.26, 'poor'],
    ['FCP', 1800, 'good'],
    ['FCP', 3001, 'poor'],
    ['TTFB', 800, 'good'],
    ['TTFB', 1800, 'needs-work'],
    ['TTFB', 1801, 'poor'],
    ['TBT', 200, 'good'],
    ['TBT', 601, 'poor'],
    ['SI', 3400, 'good'],
    ['SI', 5800, 'needs-work'],
    ['SI', 5801, 'poor'],
  ] as const)('%s %s -> %s', (id, v, rating) => expect(rateMetric(id, v)).toBe(rating))

  it('returns null for missing values', () => {
    expect(rateMetric('LCP', undefined)).toBeNull()
    expect(rateMetric('LCP', Number.NaN)).toBeNull()
  })
})

describe('helpers', () => {
  it('converts 0-1 scores', () => {
    expect(toScore100(0.894)).toBe(89)
    expect(toScore100(null)).toBeNull()
    expect(rateAuditScore(0.9)).toBe('good')
  })

  it('maps CrUX categories', () => {
    expect(rateCruxCategory('FAST')).toBe('good')
    expect(rateCruxCategory('AVERAGE')).toBe('needs-work')
    expect(rateCruxCategory('SLOW')).toBe('poor')
    expect(rateCruxCategory('NONE')).toBeNull()
  })
})
