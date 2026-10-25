import { formatMs } from '@/lib/format'
import type { Report } from '@/lib/psi-types'
import { Section } from './Section'

interface Frame {
  timing: number
  data: string
}

function framesOf(report: Report): Frame[] {
  const items = report.audits['screenshot-thumbnails']?.details?.items
  if (!Array.isArray(items)) return []
  return items.flatMap((i: unknown) => {
    if (typeof i !== 'object' || i === null) return []
    const { timing, data } = i as { timing?: unknown; data?: unknown }
    if (typeof timing !== 'number' || typeof data !== 'string' || !data.startsWith('data:image/'))
      return []
    return [{ timing, data }]
  })
}

export function Filmstrip({ report }: { report: Report }) {
  const frames = framesOf(report)
  if (frames.length === 0) return null
  const end = frames[frames.length - 1]?.timing ?? 1
  const fcp = report.audits['first-contentful-paint']?.numericValue
  const lcp = report.audits['largest-contentful-paint']?.numericValue

  return (
    <Section
      id="filmstrip"
      title="How it loaded"
      intro="Frames captured during the lab test. Look for long stretches of blank screen and for content that appears late."
    >
      <div
        className="well overflow-x-auto p-3"
        tabIndex={0}
        role="region"
        aria-label={`Loading filmstrip, ${frames.length} frames from 0 to ${formatMs(end)}`}
      >
        <ol className="flex min-w-max gap-2">
          {frames.map((f, i) => {
            const marks = [
              fcp != null && f.timing >= fcp && (frames[i - 1]?.timing ?? -1) < fcp ? 'FCP' : null,
              lcp != null && f.timing >= lcp && (frames[i - 1]?.timing ?? -1) < lcp ? 'LCP' : null,
            ].filter(Boolean)
            return (
              <li key={i} className="flex w-[84px] flex-col items-center gap-1.5 sm:w-[96px]">
                <img
                  src={f.data}
                  alt={`Page at ${formatMs(f.timing)}`}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[9/16] w-full rounded-[3px] border border-rule bg-plate object-cover object-top"
                />
                <span className="num-narrow text-[0.75rem] text-ink-2">{formatMs(f.timing)}</span>
                {marks.length > 0 && (
                  <span className="num-narrow rounded-chip bg-signal-soft px-1 text-[0.6875rem] text-ink">
                    {marks.join(' + ')}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </Section>
  )
}
