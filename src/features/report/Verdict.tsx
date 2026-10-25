import { Gauge, Timer, Users, Wrench, type LucideIcon } from 'lucide-react'
import { RatingMark } from '@/components/shared/RatingBadge'
import { ratingTextClass } from '@/components/shared/rating-classes'
import type { Report } from '@/lib/psi-types'
import { categoryScore, type SummaryKind, type SummaryLine } from '@/lib/report-model'
import { rateScore } from '@/lib/ratings'
import { cn } from '@/lib/utils'

const ICON: Record<SummaryKind, LucideIcon> = {
  speed: Gauge,
  metric: Timer,
  win: Wrench,
  field: Users,
}

const RAIL = { good: 'bg-good', 'needs-work': 'bg-warn', poor: 'bg-poor' } as const

/** The plain-language summary as a card: performance readout on the left, findings on the right. */
export function Verdict({ report, lines }: { report: Report; lines: SummaryLine[] }) {
  const perf = categoryScore(report, 'performance')
  const rating = rateScore(perf)
  if (lines.length === 0) return null

  return (
    <div className="plate relative overflow-hidden">
      <span
        aria-hidden
        className={cn('absolute inset-y-0 left-0 w-1.5', rating ? RAIL[rating] : 'bg-edge')}
      />
      <div className="grid gap-6 py-6 pr-6 pl-7 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
        {perf != null && (
          <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-1 sm:border-r sm:border-rule sm:pr-8">
            <p className="text-sm text-ink-2">Performance</p>
            <p className={cn('num text-6xl leading-none', ratingTextClass(rating))}>
              {perf}
              <span className="sr-only"> out of 100</span>
            </p>
            {rating && <RatingMark rating={rating} className="text-sm" />}
          </div>
        )}
        <ul className="space-y-3">
          {lines.map((line) => {
            const Icon = ICON[line.kind]
            return (
              <li key={line.text} className="flex gap-3 text-[1.0625rem] leading-relaxed text-ink">
                <span
                  aria-hidden
                  className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-well text-signal"
                >
                  <Icon className="size-4" strokeWidth={2} />
                </span>
                <span>{line.text}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
