import {
  CircleSlash,
  CloudOff,
  Gauge,
  KeyRound,
  ServerCrash,
  TimerOff,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { displayUrl } from '@/lib/format'
import type { PsiError, PsiErrorKind } from '@/lib/psi-client'

const ICON: Record<PsiErrorKind, LucideIcon> = {
  'invalid-url': CircleSlash,
  'bad-key': KeyRound,
  quota: Gauge,
  server: ServerCrash,
  timeout: TimerOff,
  offline: WifiOff,
  network: CloudOff,
  aborted: CircleSlash,
  site: CircleSlash,
  parse: ServerCrash,
}

export function ErrorView({
  error,
  url,
  onRetry,
  onEdit,
  compact = false,
}: {
  error: PsiError
  url: string
  onRetry: () => void
  onEdit: () => void
  /** Inline banner style, used when one of two strategies failed. */
  compact?: boolean
}) {
  const Icon = ICON[error.kind]
  const [wait, setWait] = useState(
    error.kind === 'quota' ? Math.min(error.retryAfter ?? 30, 120) : 0,
  )
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (wait <= 0) return
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000)
    return () => window.clearTimeout(t)
  }, [wait])

  useEffect(() => {
    if (!compact) headingRef.current?.focus()
  }, [compact])

  const showKeyLink = error.kind === 'quota' || error.kind === 'bad-key'
  const showEdit = error.kind === 'invalid-url' || error.kind === 'site'
  const aborted = error.kind === 'aborted'

  const Heading = compact ? 'h3' : 'h1'

  return (
    <section
      role={aborted ? 'status' : 'alert'}
      className={
        compact
          ? 'flex gap-4 rounded-plate border border-rule bg-plate p-5'
          : 'mx-auto flex max-w-[1240px] flex-col gap-8 px-4 py-14 sm:px-6 md:flex-row md:py-20'
      }
    >
      <span
        aria-hidden
        className={
          compact
            ? 'flex size-10 shrink-0 items-center justify-center rounded-control bg-well text-ink'
            : 'flex size-20 shrink-0 items-center justify-center rounded-plate bg-well text-ink'
        }
      >
        <Icon className={compact ? 'size-5' : 'size-9'} strokeWidth={1.75} />
      </span>
      <div className="max-w-2xl">
        {!compact && <p className="[overflow-wrap:anywhere] text-ink-2">{displayUrl(url)}</p>}
        <Heading
          ref={headingRef}
          tabIndex={-1}
          className={
            compact ? 'font-label text-lg' : 'font-display mt-1 text-4xl outline-none sm:text-5xl'
          }
        >
          {error.title}
        </Heading>
        <p className={compact ? 'mt-1 text-ink-2' : 'mt-4 text-lg text-ink-2'}>{error.message}</p>

        <div className={compact ? 'mt-4 flex flex-wrap gap-2' : 'mt-8 flex flex-wrap gap-3'}>
          {(error.retryable || aborted) && (
            <Button size={compact ? 'default' : 'lg'} onClick={onRetry} disabled={wait > 0}>
              {wait > 0 ? `Retry in ${wait} s` : aborted ? 'Run it again' : 'Try again'}
            </Button>
          )}
          {showKeyLink && (
            <Button
              asChild
              size={compact ? 'default' : 'lg'}
              variant={error.kind === 'bad-key' ? 'default' : 'outline'}
            >
              <Link to="/settings">
                {error.kind === 'bad-key' ? 'Check your key' : 'Add an API key'}
              </Link>
            </Button>
          )}
          {(showEdit || !compact) && (
            <Button size={compact ? 'default' : 'lg'} variant="outline" onClick={onEdit}>
              Edit the address
            </Button>
          )}
        </div>

        {error.kind === 'quota' && (
          <p className="mt-4 text-sm text-ink-2">
            A free key from Google Cloud gives you your own quota of about 25,000 tests a day. It
            takes about five minutes to set up.
          </p>
        )}

        {error.detail && (
          <details className="mt-6 text-sm text-ink-2">
            <summary className="cursor-pointer select-none hover:text-ink">
              Technical detail
            </summary>
            <p className="num-narrow mt-2 rounded-window bg-well p-3 text-[0.8125rem] break-words">
              {error.status ? `HTTP ${error.status}: ` : ''}
              {error.detail}
            </p>
          </details>
        )}
      </div>
    </section>
  )
}
