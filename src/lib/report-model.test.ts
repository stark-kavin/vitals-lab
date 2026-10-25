import { describe, expect, it } from 'vitest'
import sample from '@/fixtures/sample-report.json'
import { groupHistory, toHistoryEntry } from './history'
import { parsePsiResponse } from './psi-client'
import {
  getLabMetrics,
  getOpportunities,
  groupCategoryAudits,
  plainTextSummary,
  savingsLabel,
  summarize,
} from './report-model'

const report = parsePsiResponse(sample, 'mobile')

describe('report model', () => {
  it('extracts lab metrics with ratings', () => {
    const lab = getLabMetrics(report)
    expect(lab.map((m) => m.id)).toEqual(expect.arrayContaining(['FCP', 'LCP', 'TBT', 'CLS', 'SI']))
    expect(lab.find((m) => m.id === 'LCP')?.rating).toBe('poor')
  })

  it('lists failing performance audits sorted by savings', () => {
    const opps = getOpportunities(report)
    expect(opps.length).toBeGreaterThan(0)
    for (const o of opps) {
      expect(o.audit.score).toBeLessThan(0.9)
      expect(['notApplicable', 'informative']).not.toContain(o.audit.scoreDisplayMode)
    }
    const savings = opps.map((o) => o.savingsMs)
    expect([...savings].sort((a, b) => b - a)).toEqual(savings)
  })

  it('filters audits by metric', () => {
    const all = getOpportunities(report)
    const fcp = getOpportunities(report, 'FCP')
    expect(fcp.length).toBeLessThanOrEqual(all.length)
    expect(fcp.every((o) => o.metrics.includes('FCP'))).toBe(true)
  })

  it('groups category audits with failures first', () => {
    const g = groupCategoryAudits(report, 'accessibility')
    expect(g.failedCount).toBeGreaterThan(0)
    expect(g.passed.length).toBeGreaterThan(0)
    expect(g.failed.every((grp) => grp.audits.every((a) => (a.score ?? 1) < 0.9))).toBe(true)
  })

  it('formats savings labels', () => {
    expect(savingsLabel({ savingsMs: 860, savingsBytes: 0, savingsCls: 0 })).toBe('Save ~860 ms')
    expect(savingsLabel({ savingsMs: 0, savingsBytes: 4096, savingsCls: 0 })).toBe('Save ~4.0 KiB')
    expect(savingsLabel({ savingsMs: 0, savingsBytes: 0, savingsCls: 0.05 })).toBe('CLS −0.05')
    expect(savingsLabel({ savingsMs: 0, savingsBytes: 0, savingsCls: 0 })).toBeNull()
  })

  it('writes a plain-language summary', () => {
    const lines = summarize(report)
    expect(lines[0]).toMatch(/loads slowly on a mid-range phone/)
    expect(lines.join(' ')).toMatch(/biggest win/)
  })

  it('builds a plain-text summary without secrets', () => {
    const text = plainTextSummary(report)
    expect(text).toContain('https://northwind-pantry.example/')
    expect(text).not.toMatch(/key=/)
  })
})

describe('history', () => {
  it('stores only compact fields', () => {
    const e = toHistoryEntry(report, 1000)
    expect(Object.keys(e).sort()).toEqual([
      'id',
      'metrics',
      'scores',
      'strategy',
      'timestamp',
      'url',
    ])
    expect(JSON.stringify(e).length).toBeLessThan(600)
    expect(e.metrics.INP).toBe(236)
  })

  it('groups runs by URL and strategy with a trend', () => {
    const a = { ...toHistoryEntry(report, 1), id: 'a' }
    const b = { ...toHistoryEntry(report, 2), id: 'b', scores: { ...a.scores, performance: 70 } }
    const c = { ...toHistoryEntry(report, 3), id: 'c', strategy: 'desktop' as const }
    const groups = groupHistory([b, c, a])
    expect(groups).toHaveLength(2)
    const mobile = groups.find((g) => g.strategy === 'mobile')
    expect(mobile?.runs).toBe(2)
    expect(mobile?.trend).toEqual([a.scores.performance, 70])
  })
})
