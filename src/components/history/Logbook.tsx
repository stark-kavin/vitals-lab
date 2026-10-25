import { History, Monitor, RotateCw, Smartphone, X } from 'lucide-react'
import { useMemo } from 'react'
import { useSettings } from '@/app/settings-context'
import { RatingMark } from '@/components/shared/RatingBadge'
import { ratingTextClass } from '@/components/shared/rating-classes'
import { Button } from '@/components/ui/button'
import { displayUrl, formatRelative } from '@/lib/format'
import { groupHistory, type HistoryGroup } from '@/lib/history'
import type { Strategy } from '@/lib/psi-types'
import { rateScore } from '@/lib/ratings'
import { Sparkline } from './Sparkline'

export function Logbook({
  onRerun,
  disabled,
}: {
  onRerun: (url: string, strategy: Strategy) => void
  disabled?: boolean
}) {
  const { history, removeHistoryEntry } = useSettings()
  const groups = useMemo(() => groupHistory(history), [history])

  return (
    <section aria-labelledby="logbook-title">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="icon-tile" aria-hidden>
            <History className="size-5" strokeWidth={1.9} />
          </span>
          <div>
            <h2 id="logbook-title" className="font-display text-2xl">
              Recent tests
            </h2>
            <p className="text-sm text-ink-2">Saved in this browser only.</p>
          </div>
        </div>
        {groups.length > 0 && (
          <span className="num-narrow rounded-full bg-well px-2.5 py-1 text-sm text-ink-2">
            {history.length} run{history.length === 1 ? '' : 's'} saved
          </span>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-5 rounded-plate border border-dashed border-edge px-5 py-8 text-center text-ink-2 sm:flex-row sm:text-left">
          <EmptyLogArt className="w-36 shrink-0" />
          <div>
            <p className="font-label text-lg text-ink">Nothing logged yet</p>
            <p className="mt-1 max-w-md text-[0.9375rem]">
              Each test you run is listed here with its scores, so you can re-run it and watch the
              trend over time.
            </p>
          </div>
        </div>
      ) : (
        <ol className="mt-5 grid border-t border-rule lg:grid-cols-2 lg:gap-x-10">
          {groups.slice(0, 12).map((g) => (
            <LogRow
              key={`${g.strategy}|${g.url}`}
              group={g}
              disabled={disabled}
              onRerun={() => onRerun(g.url, g.strategy)}
              onRemove={() => removeHistoryEntry(g.latest.id)}
            />
          ))}
        </ol>
      )}
    </section>
  )
}

function LogRow({
  group,
  onRerun,
  onRemove,
  disabled,
}: {
  group: HistoryGroup
  onRerun: () => void
  onRemove: () => void
  disabled?: boolean
}) {
  const perf = group.latest.scores.performance
  const rating = rateScore(perf)
  const DeviceIcon = group.strategy === 'mobile' ? Smartphone : Monitor
  const time = new Date(group.latest.timestamp)

  return (
    <li className="row-hover grid grid-cols-[3rem_1fr_auto] items-center gap-x-3 gap-y-1 border-b border-rule py-3 pl-3">
      <span
        className={`num row-span-2 text-2xl leading-none ${ratingTextClass(rating)}`}
        aria-hidden
      >
        {perf ?? '–'}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium text-ink" title={group.url}>
          {displayUrl(group.url)}
        </p>
      </div>
      <div className="row-span-2 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRerun}
          disabled={disabled}
          aria-label={`Re-run ${displayUrl(group.url)} on ${group.strategy}`}
          title="Re-run"
        >
          <RotateCw aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label={`Remove latest ${group.strategy} run of ${displayUrl(group.url)} from history`}
          title="Remove"
        >
          <X aria-hidden />
        </Button>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
        <span className="sr-only">
          Performance {perf ?? 'not scored'}
          {rating ? `, ${rating === 'needs-work' ? 'needs work' : rating}` : ''}.
        </span>
        <span className="inline-flex items-center gap-1">
          <DeviceIcon className="size-3.5" aria-hidden />
          {group.strategy === 'mobile' ? 'Mobile' : 'Desktop'}
        </span>
        <time dateTime={time.toISOString()} title={time.toLocaleString()}>
          {formatRelative(group.latest.timestamp)}
        </time>
        {rating && (
          <RatingMark rating={rating} className="hidden text-[0.8125rem] sm:inline-flex" />
        )}
        {group.trend.length > 1 && <Sparkline values={group.trend.slice(-10)} />}
      </div>
    </li>
  )
}

/** Empty logbook: a ruled page with a small dial waiting for its first reading. */
function EmptyLogArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 110" className={className} aria-hidden>
      <rect x="18" y="8" width="96" height="94" rx="8" fill="var(--plate)" stroke="var(--rule)" />
      <rect x="18" y="8" width="96" height="18" rx="8" fill="var(--well)" />
      {[38, 52, 66, 80].map((y, i) => (
        <g key={y} opacity={1 - i * 0.2}>
          <rect x="30" y={y} width="10" height="6" rx="2" fill="var(--rule)" />
          <rect x="46" y={y} width={52 - i * 8} height="6" rx="2" fill="var(--rule)" />
        </g>
      ))}
      <g transform="translate(112 74)">
        <circle r="26" fill="var(--plate)" stroke="var(--rule)" />
        <path
          d="M -17 10 A 20 20 0 1 1 17 10"
          fill="none"
          stroke="var(--ink-2)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M 0 0 L -9 -12" stroke="var(--signal)" strokeWidth="3" strokeLinecap="round" />
        <circle r="3.5" fill="var(--ink)" />
      </g>
    </svg>
  )
}
