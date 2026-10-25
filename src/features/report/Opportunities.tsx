import { useMemo, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Report } from '@/lib/psi-types'
import {
  FILTER_METRICS,
  getOpportunities,
  getPassedPerformanceAudits,
  savingsLabel,
  type FilterMetric,
} from '@/lib/report-model'
import { AuditItem } from './AuditItem'
import { Collapsible, Section } from './Section'
import { SECTION_META } from './sections'
import { CircleCheck } from 'lucide-react'

export function Opportunities({ report }: { report: Report }) {
  const [filter, setFilter] = useState<FilterMetric | 'all'>('all')
  const all = useMemo(() => getOpportunities(report), [report])
  const shown = useMemo(() => getOpportunities(report, filter), [report, filter])
  const passed = useMemo(() => getPassedPerformanceAudits(report), [report])
  const maxSavings = Math.max(0, ...all.map((o) => o.savingsMs))
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length }
    for (const m of FILTER_METRICS) c[m] = all.filter((o) => o.metrics.includes(m)).length
    return c
  }, [all])

  if (!report.categories.some((c) => c.id === 'performance')) return null

  return (
    <Section
      id="opportunities"
      icon={SECTION_META.opportunities?.icon}
      title="What to fix first"
      intro="Performance audits that didn’t pass, biggest estimated time savings first. Savings are Google’s estimates for this one test."
    >
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={filter}
        onValueChange={(v) => v && setFilter(v as FilterMetric | 'all')}
        aria-label="Show audits affecting"
      >
        <ToggleGroupItem value="all">
          All <span className="num-narrow text-[0.75rem] text-ink-2">{counts.all}</span>
        </ToggleGroupItem>
        {FILTER_METRICS.map((m) => (
          <ToggleGroupItem key={m} value={m} aria-label={`${m}, ${counts[m]} audits`}>
            {m} <span className="num-narrow text-[0.75rem] text-ink-2">{counts[m]}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <p className="sr-only" aria-live="polite">
        {shown.length} audits shown
      </p>

      {shown.length === 0 ? (
        <p className="mt-4 rounded-plate border border-dashed border-edge px-5 py-6 text-ink-2">
          {all.length === 0
            ? 'Nothing to fix here: every performance audit passed.'
            : `No failing audits affect ${filter}.`}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {shown.map((o) => (
            <AuditItem
              key={o.audit.id}
              audit={o.audit}
              badge={savingsLabel(o)}
              tags={o.metrics}
              meter={maxSavings > 0 ? o.savingsMs / maxSavings : undefined}
            />
          ))}
        </ul>
      )}

      <Collapsible summary="Passed performance audits" count={passed.length} icon={CircleCheck}>
        <ul className="divide-y divide-rule">
          {passed.map((a) => (
            <AuditItem key={a.id} audit={a} />
          ))}
        </ul>
      </Collapsible>
    </Section>
  )
}
