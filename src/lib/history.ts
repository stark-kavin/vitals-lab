import { parseCrux } from './crux'
import type { Report } from './psi-types'
import { categoryScore } from './report-model'
import type { HistoryEntry } from './storage'

function metric(report: Report, auditId: string): number | null {
  const v = report.audits[auditId]?.numericValue
  return typeof v === 'number' ? v : null
}

/** `url` is the address the user asked for; defaults to what Lighthouse reports. */
export function toHistoryEntry(
  report: Report,
  now = Date.now(),
  url = report.requestedUrl || report.finalUrl,
): HistoryEntry {
  const inp = parseCrux(report.loadingExperience)?.metrics.find((m) => m.id === 'INP')
  return {
    id: `${report.strategy}:${url}:${now}`,
    url,
    strategy: report.strategy,
    timestamp: now,
    scores: {
      performance: categoryScore(report, 'performance'),
      accessibility: categoryScore(report, 'accessibility'),
      'best-practices': categoryScore(report, 'best-practices'),
      seo: categoryScore(report, 'seo'),
    },
    metrics: {
      FCP: metric(report, 'first-contentful-paint'),
      LCP: metric(report, 'largest-contentful-paint'),
      TBT: metric(report, 'total-blocking-time'),
      CLS: metric(report, 'cumulative-layout-shift'),
      SI: metric(report, 'speed-index'),
      INP: inp?.p75 ?? null,
    },
  }
}

export interface HistoryGroup {
  url: string
  strategy: HistoryEntry['strategy']
  latest: HistoryEntry
  /** Oldest to newest performance scores, for the trend sparkline. */
  trend: number[]
  runs: number
}

/** One row per URL + strategy, newest first, with that pair's score trend. */
export function groupHistory(entries: HistoryEntry[]): HistoryGroup[] {
  const map = new Map<string, HistoryEntry[]>()
  for (const e of entries) {
    const k = `${e.strategy}|${e.url}`
    const list = map.get(k)
    if (list) list.push(e)
    else map.set(k, [e])
  }
  return [...map.values()]
    .flatMap((list) => {
      const sorted = [...list].sort((a, b) => a.timestamp - b.timestamp)
      const latest = sorted.at(-1)
      if (!latest) return []
      return {
        url: latest.url,
        strategy: latest.strategy,
        latest,
        trend: sorted.map((e) => e.scores.performance).filter((s): s is number => s != null),
        runs: sorted.length,
      }
    })
    .sort((a, b) => b.latest.timestamp - a.latest.timestamp)
}
