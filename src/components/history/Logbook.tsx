import { Monitor, RotateCw, Smartphone, X } from 'lucide-react'
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
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="logbook-title" className="font-display text-2xl">
          Recent tests
        </h2>
        {groups.length > 0 && (
          <span className="num-narrow text-sm text-ink-2">
            {history.length} run{history.length === 1 ? '' : 's'} saved
          </span>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="mt-4 rounded-plate border border-dashed border-edge px-5 py-8 text-ink-2">
          <p className="text-ink">Nothing logged yet.</p>
          <p className="mt-1 max-w-sm text-[0.9375rem]">
            Each test you run is listed here with its scores, so you can re-run it and watch the
            trend. The log lives only in this browser.
          </p>
        </div>
      ) : (
        <ol className="mt-3 divide-y divide-rule border-y border-rule">
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
    <li className="grid grid-cols-[3rem_1fr_auto] items-center gap-x-3 gap-y-1 py-3">
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
