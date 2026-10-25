import { Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { InfoPopover } from '@/components/shared/InfoPopover'
import { METRIC_ICON } from '@/components/shared/metric-icons'
import { RatingMark } from '@/components/shared/RatingBadge'
import { ratingTextClass } from '@/components/shared/rating-classes'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { parseCrux, type FieldMetric } from '@/lib/crux'
import { formatPercent } from '@/lib/format'
import { METRIC_INFO } from '@/lib/metric-info'
import type { Report } from '@/lib/psi-types'
import { formatMetric } from '@/lib/report-model'
import { METRIC_THRESHOLDS } from '@/lib/ratings'
import { Section } from './Section'
import { SECTION_META } from './sections'

type Scope = 'url' | 'origin'

export function FieldData({ report }: { report: Report }) {
  const urlData = useMemo(() => parseCrux(report.loadingExperience), [report])
  const originData = useMemo(() => parseCrux(report.originLoadingExperience), [report])
  const [scope, setScope] = useState<Scope>(urlData || !originData ? 'url' : 'origin')
  const data = scope === 'url' ? urlData : originData

  return (
    <Section
      id="field"
      icon={SECTION_META.field?.icon}
      title="Real visitors"
      intro={
        <>
          Field data from the Chrome UX Report: how real Chrome users experienced this{' '}
          {scope === 'url' ? 'page' : 'site'} over the previous 28 days. Values are the 75th
          percentile, so three in four visits were at least this fast.
        </>
      }
      aside={
        <ToggleGroup
          type="single"
          value={scope}
          onValueChange={(v) => v && setScope(v as Scope)}
          aria-label="Field data scope"
        >
          <ToggleGroupItem value="url">This URL</ToggleGroupItem>
          <ToggleGroupItem value="origin">Whole origin</ToggleGroupItem>
        </ToggleGroup>
      }
    >
      {data ? (
        <div className="plate overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-4">
            <p className="flex items-center gap-2 text-ink">
              <Users className="size-4 text-ink-2" aria-hidden />
              <span className="font-label">Core Web Vitals assessment</span>
              <InfoPopover title="Core Web Vitals">
                <p>
                  Google’s three key experience metrics: LCP (loading), INP (responsiveness) and CLS
                  (visual stability). A page passes when all three are rated good at the 75th
                  percentile.
                </p>
              </InfoPopover>
            </p>
            {data.coreWebVitals === 'passed' && <RatingMark rating="good" label="Passed" />}
            {data.coreWebVitals === 'failed' && <RatingMark rating="poor" label="Failed" />}
            {data.coreWebVitals === 'unknown' && (
              <span className="text-ink-2">Not enough data to assess</span>
            )}
          </div>
          <ul className="divide-y divide-rule">
            {data.metrics.map((m) => (
              <FieldRow key={m.id} metric={m} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex gap-4 rounded-plate border border-dashed border-edge px-5 py-6">
          <Users className="mt-0.5 size-5 shrink-0 text-ink-2" aria-hidden />
          <div>
            <p className="text-ink">
              {scope === 'url'
                ? 'Not enough real-user traffic for this URL.'
                : 'Not enough real-user traffic for this site.'}
            </p>
            <p className="mt-1 max-w-[60ch] text-[0.9375rem] text-ink-2">
              Chrome only publishes field data once a page has a meaningful number of visits.{' '}
              {scope === 'url' && originData
                ? 'Data for the whole origin is available: switch to “Whole origin” above.'
                : 'The lab results below still show what to improve.'}
            </p>
          </div>
        </div>
      )}
    </Section>
  )
}

function FieldRow({ metric }: { metric: FieldMetric }) {
  const info = METRIC_INFO[metric.id]
  const MetricIcon = METRIC_ICON[metric.id]
  const d = metric.distribution
  const t = METRIC_THRESHOLDS[metric.id]
  const unit = (v: number) => formatMetric(metric.id, v)
  const segments = [
    { key: 'good', share: d.good, cls: 'bg-good', label: `Good (≤ ${unit(t.good)})` },
    { key: 'warn', share: d.needsWork, cls: 'bg-warn', label: 'Needs work' },
    { key: 'poor', share: d.poor, cls: 'bg-poor', label: `Poor (> ${unit(t.poor)})` },
  ]

  return (
    <li className="grid gap-x-6 gap-y-3 px-5 py-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div>
        <p className="flex items-center gap-1">
          <span
            aria-hidden
            className="mr-1 flex size-6 items-center justify-center rounded-[6px] bg-well text-signal"
          >
            <MetricIcon className="size-3.5" />
          </span>
          <span className="font-label text-ink">{info.name}</span>
          <span className="num-narrow text-[0.75rem] text-ink-2">{metric.id}</span>
          <InfoPopover title={info.name}>
            <p>{info.long}</p>
            <p>
              Good is {unit(t.good)} or less; poor is over {unit(t.poor)}.
            </p>
          </InfoPopover>
        </p>
        <p className="mt-1 flex items-baseline gap-3">
          <span className={`num text-2xl ${ratingTextClass(metric.rating)}`}>
            {unit(metric.p75)}
          </span>
          {metric.rating && <RatingMark rating={metric.rating} className="text-sm" />}
        </p>
      </div>
      <div className="min-w-0 self-center">
        <div
          className="flex h-3 w-full gap-[2px] overflow-hidden rounded-[3px]"
          role="img"
          aria-label={`${formatPercent(d.good)} good, ${formatPercent(d.needsWork)} needs work, ${formatPercent(d.poor)} poor`}
        >
          {segments.map((s) =>
            s.share > 0 ? (
              <span key={s.key} className={s.cls} style={{ width: `${s.share * 100}%` }} />
            ) : null,
          )}
        </div>
        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[0.8125rem] text-ink-2">
          {segments.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span aria-hidden className={`inline-block size-2 rounded-[2px] ${s.cls}`} />
              <dt>{s.label}</dt>
              <dd className="num-narrow text-ink">{formatPercent(s.share)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </li>
  )
}
