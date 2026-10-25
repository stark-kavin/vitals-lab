import { METRIC_THRESHOLDS, type MetricId } from '@/lib/ratings'
import { cn } from '@/lib/utils'

/**
 * A short linear scale split into good / needs work / poor zones with a
 * marker at the measured value. Decorative: the value and rating are always
 * printed next to it, so it's hidden from assistive tech.
 */
export function StripGauge({
  id,
  value,
  className,
}: {
  id: MetricId
  value: number
  className?: string
}) {
  const t = METRIC_THRESHOLDS[id]
  const max = t.poor * 1.6
  const pct = (v: number) => Math.min(100, Math.max(0, (v / max) * 100))
  const goodW = pct(t.good)
  const warnW = pct(t.poor) - goodW
  const over = value > max
  const marker = over ? 97 : pct(value)

  return (
    <div aria-hidden className={cn('relative h-5 w-full', className)}>
      <div className="absolute inset-x-0 top-[7px] flex h-[6px] gap-[2px] overflow-hidden rounded-[2px]">
        <span className="bg-good opacity-60" style={{ width: `${goodW}%` }} />
        <span className="bg-warn opacity-60" style={{ width: `${warnW}%` }} />
        <span className="flex-1 bg-poor opacity-60" />
      </div>
      <span
        className="absolute top-0 h-5 w-[3px] -translate-x-1/2 rounded-full bg-ink shadow-[0_0_0_2px_var(--plate)]"
        style={{ left: `${marker}%` }}
      />
      {over && (
        // Off the end of the scale: a small arrow points past the poor zone.
        <span className="absolute top-[4px] -right-[2px] h-0 w-0 border-y-[6px] border-l-[7px] border-y-transparent border-l-ink" />
      )}
    </div>
  )
}
