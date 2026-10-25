import { Link } from 'react-router'
import { useSettings } from '@/app/settings-context'
import { cn } from '@/lib/utils'

/** Small honest status about which quota the next run will use. */
export function KeyStatus({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { apiKey } = useSettings()
  return (
    <p className={cn('flex items-center gap-2 text-sm text-ink-2', className)}>
      <span
        aria-hidden
        className={cn(
          'inline-block size-2 shrink-0 rounded-full',
          apiKey
            ? 'bg-good shadow-[0_0_0_3px_var(--good-soft)]'
            : 'bg-warn shadow-[0_0_0_3px_var(--warn-soft)]',
        )}
      />
      {apiKey ? (
        <span>
          Using your API key.{' '}
          {!compact && (
            <Link to="/settings" className="underline">
              Manage
            </Link>
          )}
        </span>
      ) : (
        <span>
          No key: shared quota, may hit rate limits.{' '}
          <Link to="/settings" className="underline">
            Add a key
          </Link>
        </span>
      )}
    </p>
  )
}
