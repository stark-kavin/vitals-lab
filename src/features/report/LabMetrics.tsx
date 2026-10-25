import { StripGauge } from '@/components/gauge/StripGauge'
import { InfoPopover } from '@/components/shared/InfoPopover'
import { METRIC_ICON } from '@/components/shared/metric-icons'
import { RatingMark } from '@/components/shared/RatingBadge'
import { ratingTextClass } from '@/components/shared/rating-classes'
import { METRIC_INFO } from '@/lib/metric-info'
import type { Report } from '@/lib/psi-types'
import { formatMetric, getLabMetrics } from '@/lib/report-model'
import { METRIC_THRESHOLDS } from '@/lib/ratings'
import { Section } from './Section'
import { SECTION_META } from './sections'

export function LabMetrics({ report }: { report: Report }) {
  const metrics = getLabMetrics(report)
  if (metrics.length === 0) return null
  const device =
    report.strategy === 'mobile' ? 'a mid-range phone on slow 4G' : 'a desktop on a fast connection'

  return (
    <Section
      id="lab"
      icon={SECTION_META.lab?.icon}
      title="Lab test"
      intro={
        <>
          One simulated visit on {device}. Lab numbers vary a little from run to run; use them to
          find causes, and the field data above to judge real experience.
        </>
      }
    >
      <ul className="grid gap-px overflow-hidden rounded-plate border border-rule bg-rule sm:grid-cols-2">
        {metrics.map((m) => {
          const info = METRIC_INFO[m.id]
          const MetricIcon = METRIC_ICON[m.id]
          const t = METRIC_THRESHOLDS[m.id]
          return (
            <li key={m.id} className="flex flex-col bg-plate px-5 py-4">
              <p className="flex items-center gap-1">
                <span
                  aria-hidden
                  className="mr-1 flex size-6 items-center justify-center rounded-[6px] bg-well text-signal"
                >
                  <MetricIcon className="size-3.5" />
                </span>
                <span className="font-label text-ink">{info.name}</span>
                <span className="num-narrow text-[0.75rem] text-ink-2">{m.id}</span>
                <InfoPopover title={info.name}>
                  <p>{info.long}</p>
                  <p>
                    Good is {formatMetric(m.id, t.good)} or less; poor is over{' '}
                    {formatMetric(m.id, t.poor)}.
                  </p>
                </InfoPopover>
              </p>
              <p className="mt-1 flex items-baseline gap-3">
                <span className={`num text-[1.75rem] leading-tight ${ratingTextClass(m.rating)}`}>
                  {m.display}
                </span>
                {m.rating && <RatingMark rating={m.rating} className="text-sm" />}
              </p>
              <p className="mt-1 text-[0.9375rem] text-ink-2">
                {info.short}
                {m.id === 'TTI' && ' Not part of the score.'}
              </p>
              <StripGauge id={m.id} value={m.value} className="mt-auto pt-3" />
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
