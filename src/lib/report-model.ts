import { parseCrux } from './crux'
import { formatBytes, formatCls, formatMs } from './format'
import { LAB_METRIC_AUDITS, METRIC_INFO } from './metric-info'
import type { Audit, AuditRef, Category, CategoryId, Report } from './psi-types'
import {
  METRIC_THRESHOLDS,
  rateMetric,
  rateScore,
  RATING_LABEL,
  toScore100,
  type MetricId,
  type Rating,
} from './ratings'

// ---------------------------------------------------------------------------
// Lab metrics
// ---------------------------------------------------------------------------

export interface LabMetric {
  id: MetricId
  value: number
  display: string
  rating: Rating | null
}

export function getLabMetrics(report: Report): LabMetric[] {
  const out: LabMetric[] = []
  for (const { id, audit } of LAB_METRIC_AUDITS) {
    const a = report.audits[audit]
    if (!a || typeof a.numericValue !== 'number') continue
    const value = a.numericValue
    out.push({
      id,
      value,
      display:
        id === 'CLS'
          ? formatCls(value)
          : (a.displayValue ?? formatMs(value)).replace(/\u00a0/g, ' '),
      rating: rateMetric(id, value),
    })
  }
  return out
}

export function formatMetric(id: MetricId, value: number): string {
  return id === 'CLS' ? formatCls(value) : formatMs(value)
}

// ---------------------------------------------------------------------------
// Category scores
// ---------------------------------------------------------------------------

export function getCategory(report: Report, id: CategoryId): Category | undefined {
  return report.categories.find((c) => c.id === id)
}

export function categoryScore(report: Report, id: CategoryId): number | null {
  return toScore100(getCategory(report, id)?.score)
}

// ---------------------------------------------------------------------------
// Opportunities and diagnostics
// ---------------------------------------------------------------------------

const SKIPPED_MODES = new Set(['notApplicable', 'informative', 'manual', 'error'])
const NON_ACTION_GROUPS = new Set(['metrics', 'hidden'])
export const FILTER_METRICS = ['FCP', 'LCP', 'TBT', 'CLS'] as const
export type FilterMetric = (typeof FILTER_METRICS)[number]

export interface Opportunity {
  audit: Audit
  ref: AuditRef
  savingsMs: number
  savingsBytes: number
  savingsCls: number
  /** Metric acronyms this audit affects. */
  metrics: string[]
}

function detailNumber(audit: Audit, key: string): number {
  const v = audit.details?.[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

export function savingsOf(audit: Audit): { ms: number; bytes: number; cls: number } {
  const ms = audit.metricSavings ?? {}
  const overall = detailNumber(audit, 'overallSavingsMs')
  const fromMetrics = Math.max(ms.LCP ?? 0, ms.FCP ?? 0, ms.TBT ?? 0, ms.INP ?? 0)
  return {
    ms: overall > 0 ? overall : fromMetrics,
    bytes: detailNumber(audit, 'overallSavingsBytes'),
    cls: ms.CLS ?? 0,
  }
}

export function savingsLabel(
  o: Pick<Opportunity, 'savingsMs' | 'savingsBytes' | 'savingsCls'>,
): string | null {
  if (o.savingsMs >= 10) return `Save ~${formatMs(o.savingsMs)}`
  if (o.savingsBytes >= 1024) return `Save ~${formatBytes(o.savingsBytes)}`
  if (o.savingsCls >= 0.001) return `CLS −${formatCls(o.savingsCls)}`
  return null
}

/** Which audits each metric filter chip should show. */
export function relevantAuditMap(perf: Category | undefined, audits: Record<string, Audit>) {
  const map = new Map<string, Set<string>>()
  for (const m of FILTER_METRICS) map.set(m, new Set())
  if (!perf) return map
  for (const ref of perf.auditRefs) {
    if (ref.acronym && ref.relevantAudits) {
      const set = map.get(ref.acronym)
      ref.relevantAudits.forEach((id) => set?.add(id))
    }
  }
  // Newer Lighthouse versions drop `relevantAudits`; fall back to which
  // metrics each audit reports savings for.
  for (const ref of perf.auditRefs) {
    const keys = Object.keys(audits[ref.id]?.metricSavings ?? {})
    for (const k of keys) map.get(k)?.add(ref.id)
  }
  return map
}

export function getOpportunities(
  report: Report,
  filter: FilterMetric | 'all' = 'all',
): Opportunity[] {
  const perf = getCategory(report, 'performance')
  if (!perf) return []
  const relevant = relevantAuditMap(perf, report.audits)
  const allowed = filter === 'all' ? null : relevant.get(filter)

  const out: Opportunity[] = []
  const seen = new Set<string>()
  for (const ref of perf.auditRefs) {
    if (seen.has(ref.id)) continue
    seen.add(ref.id)
    if (ref.group && NON_ACTION_GROUPS.has(ref.group)) continue
    const audit = report.audits[ref.id]
    if (!audit || audit.score == null) continue
    if (audit.scoreDisplayMode && SKIPPED_MODES.has(audit.scoreDisplayMode)) continue
    if (audit.score >= 0.9) continue
    if (allowed && !allowed.has(ref.id)) continue
    const s = savingsOf(audit)
    const metrics = FILTER_METRICS.filter((m) => relevant.get(m)?.has(ref.id))
    out.push({ audit, ref, savingsMs: s.ms, savingsBytes: s.bytes, savingsCls: s.cls, metrics })
  }
  return out.sort(
    (a, b) =>
      b.savingsMs - a.savingsMs ||
      b.savingsCls - a.savingsCls ||
      b.savingsBytes - a.savingsBytes ||
      (a.audit.score ?? 0) - (b.audit.score ?? 0),
  )
}

/** Performance audits that passed (score >= 0.9), for the collapsed list. */
export function getPassedPerformanceAudits(report: Report): Audit[] {
  const perf = getCategory(report, 'performance')
  if (!perf) return []
  return perf.auditRefs
    .filter((r) => !r.group || !NON_ACTION_GROUPS.has(r.group))
    .map((r) => report.audits[r.id])
    .filter(
      (a): a is Audit =>
        !!a && a.score != null && a.score >= 0.9 && !SKIPPED_MODES.has(a.scoreDisplayMode ?? ''),
    )
}

// ---------------------------------------------------------------------------
// Grouped audits for Accessibility / Best Practices / SEO
// ---------------------------------------------------------------------------

export interface AuditGroup {
  id: string
  title: string
  description?: string
  audits: Audit[]
}

export interface GroupedAudits {
  failed: AuditGroup[]
  failedCount: number
  passed: Audit[]
  manual: Audit[]
  notApplicable: Audit[]
}

export function groupCategoryAudits(report: Report, categoryId: CategoryId): GroupedAudits {
  const cat = getCategory(report, categoryId)
  const result: GroupedAudits = {
    failed: [],
    failedCount: 0,
    passed: [],
    manual: [],
    notApplicable: [],
  }
  if (!cat) return result

  const groups = new Map<string, AuditGroup>()
  for (const ref of cat.auditRefs) {
    if (ref.group === 'hidden') continue
    const audit = report.audits[ref.id]
    if (!audit) continue
    const mode = audit.scoreDisplayMode
    if (mode === 'manual') {
      result.manual.push(audit)
      continue
    }
    if (mode === 'notApplicable') {
      result.notApplicable.push(audit)
      continue
    }
    if (mode === 'informative' || audit.score == null) continue
    if (audit.score >= 0.9) {
      result.passed.push(audit)
      continue
    }
    const gid = ref.group ?? 'other'
    let g = groups.get(gid)
    if (!g) {
      const meta = ref.group ? report.categoryGroups[ref.group] : undefined
      g = {
        id: gid,
        title: meta?.title ?? 'Other checks',
        description: meta?.description,
        audits: [],
      }
      groups.set(gid, g)
    }
    g.audits.push(audit)
    result.failedCount++
  }
  result.failed = [...groups.values()]
  for (const g of result.failed) {
    g.audits.sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
  }
  return result
}

// ---------------------------------------------------------------------------
// Plain-language summary
// ---------------------------------------------------------------------------

function lowerFirst(s: string): string {
  const [first = '', second = ''] = s
  return second && second !== second.toUpperCase() ? first.toLowerCase() + s.slice(1) : s
}

export type SummaryKind = 'speed' | 'metric' | 'win' | 'field'
export interface SummaryLine {
  kind: SummaryKind
  text: string
}

export function summarize(report: Report): SummaryLine[] {
  const lines: SummaryLine[] = []
  const device = report.strategy === 'mobile' ? 'on a mid-range phone' : 'on desktop'
  const perf = categoryScore(report, 'performance')
  const rating = rateScore(perf)

  if (rating === 'good') lines.push({ kind: 'speed', text: `This page loads quickly ${device}.` })
  else if (rating === 'needs-work')
    lines.push({
      kind: 'speed',
      text: `This page loads at a middling pace ${device}; there’s room to improve.`,
    })
  else if (rating === 'poor')
    lines.push({ kind: 'speed', text: `This page loads slowly ${device}.` })

  const worst = getLabMetrics(report)
    .filter((m) => m.rating === 'poor' && m.id !== 'TTI')
    .sort((a, b) => ratioOver(b) - ratioOver(a))[0]
  if (worst) {
    lines.push({
      kind: 'metric',
      text: `${METRIC_INFO[worst.id].name} is ${worst.display}, well past the ${formatMetric(worst.id, thresholdGood(worst.id))} target.`,
    })
  }

  const top = getOpportunities(report)[0]
  if (top) {
    const extra =
      top.savingsMs >= 10
        ? ` (could save about ${formatMs(top.savingsMs)})`
        : top.savingsBytes >= 1024
          ? ` (could save about ${formatBytes(top.savingsBytes)})`
          : ''
    lines.push({ kind: 'win', text: `The biggest win: ${lowerFirst(top.audit.title)}${extra}.` })
  }

  const field = parseCrux(report.loadingExperience)
  if (field && field.coreWebVitals !== 'unknown') {
    lines.push({
      kind: 'field',
      text:
        field.coreWebVitals === 'passed'
          ? 'Real visitors over the last 28 days pass the Core Web Vitals.'
          : 'Real visitors over the last 28 days don’t pass the Core Web Vitals yet.',
    })
  }
  return lines
}

function thresholdGood(id: MetricId): number {
  return METRIC_THRESHOLDS[id].good
}

function ratioOver(m: LabMetric): number {
  return m.value / thresholdGood(m.id)
}

/** Plain-text summary for the clipboard. Never includes the API key. */
export function plainTextSummary(report: Report): string {
  const out: string[] = []
  out.push(`PageSpeed report: ${report.finalUrl}`)
  out.push(
    `${report.strategy === 'mobile' ? 'Mobile' : 'Desktop'} · ${report.fetchTime ?? ''} · Lighthouse ${report.lighthouseVersion ?? '?'}`,
  )
  out.push('')
  out.push('Scores')
  for (const c of report.categories) {
    const s = toScore100(c.score)
    const r = rateScore(s)
    out.push(`  ${c.title}: ${s ?? '–'}${r ? ` (${RATING_LABEL[r]})` : ''}`)
  }
  const lab = getLabMetrics(report)
  if (lab.length) {
    out.push('')
    out.push('Lab metrics')
    for (const m of lab)
      out.push(
        `  ${METRIC_INFO[m.id].name}: ${m.display}${m.rating ? ` (${RATING_LABEL[m.rating]})` : ''}`,
      )
  }
  const field = parseCrux(report.loadingExperience)
  if (field) {
    out.push('')
    out.push('Real-user data (p75, last 28 days)')
    for (const m of field.metrics)
      out.push(
        `  ${m.id}: ${formatMetric(m.id, m.p75)}${m.rating ? ` (${RATING_LABEL[m.rating]})` : ''}`,
      )
  }
  const opps = getOpportunities(report).slice(0, 5)
  if (opps.length) {
    out.push('')
    out.push('Top opportunities')
    for (const o of opps) {
      const l = savingsLabel(o)
      out.push(`  - ${o.audit.title}${l ? ` (${l})` : ''}`)
    }
  }
  const summary = summarize(report)
  if (summary.length) {
    out.push('')
    out.push(summary.map((l) => l.text).join(' '))
  }
  return out.join('\n')
}
