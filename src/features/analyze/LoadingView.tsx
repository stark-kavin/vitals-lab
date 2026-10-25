import { Monitor, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { displayUrl, formatElapsed } from '@/lib/format'
import { PSI_TIMEOUT_MS } from '@/lib/psi-client'
import type { Strategy } from '@/lib/psi-types'
import { cn } from '@/lib/utils'

function stagesFor(strategies: Strategy[]): { at: number; label: string }[] {
  const throttle = strategies.includes('mobile')
    ? 'Throttling to a mid-range phone on a slow 4G connection'
    : 'Simulating a desktop on a fast connection'
  return [
    { at: 0, label: 'Sending the page to Google’s test servers' },
    { at: 4, label: 'Loading the page in a fresh Chrome' },
    { at: 10, label: throttle },
    { at: 17, label: 'Measuring paint timings' },
    { at: 25, label: 'Recording the loading filmstrip' },
    { at: 33, label: 'Watching for layout shifts and long tasks' },
    { at: 42, label: 'Running accessibility, best practice and SEO checks' },
    { at: 52, label: 'Scoring audits' },
    { at: 62, label: 'Still working. Heavy pages can take up to 90 seconds' },
  ]
}

export function LoadingView({
  url,
  strategies,
  startedAt,
  onCancel,
}: {
  url: string
  strategies: Strategy[]
  startedAt: number
  onCancel: () => void
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(t)
  }, [])

  const elapsed = Math.max(0, (now - startedAt) / 1000)
  const stages = stagesFor(strategies)
  const stageIndex = stages.reduce((idx, s, i) => (elapsed >= s.at ? i : idx), 0)
  const stage = stages[stageIndex]?.label ?? ''
  const limit = PSI_TIMEOUT_MS / 1000

  return (
    <section
      aria-labelledby="loading-title"
      aria-busy="true"
      className="mx-auto grid max-w-[1240px] items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16 md:py-20"
    >
      <HuntingDial className="mx-auto w-56 md:w-72" />

      <div className="max-w-xl">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-2">
          {strategies.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              {s === 'mobile' ? (
                <Smartphone className="size-4" aria-hidden />
              ) : (
                <Monitor className="size-4" aria-hidden />
              )}
              {s === 'mobile' ? 'Mobile' : 'Desktop'}
            </span>
          ))}
        </p>
        <h1
          id="loading-title"
          className="font-display mt-2 text-4xl [overflow-wrap:anywhere] sm:text-5xl"
        >
          Testing {displayUrl(url)}
        </h1>

        <p className="mt-6 flex items-baseline gap-3">
          <span className="num text-3xl text-ink" aria-hidden>
            {formatElapsed(elapsed)}
          </span>
          <span className="text-ink-2">elapsed. Most tests take 10 to 60 seconds.</span>
        </p>

        <ol aria-label="Test stages" className="mt-6 space-y-1.5">
          {stages
            .slice(0, stageIndex + 1)
            .slice(-3)
            .map((s, i, arr) => {
              const current = i === arr.length - 1
              return (
                <li
                  key={s.label}
                  className={cn(
                    'flex items-center gap-3 text-[0.9375rem]',
                    current ? 'text-ink' : 'text-ink-2',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      current ? 'animate-pulse bg-signal' : 'bg-edge',
                    )}
                  />
                  {s.label}
                </li>
              )
            })}
        </ol>
        <p role="status" className="sr-only">
          {stage}
        </p>
        <p className="mt-3 text-sm text-ink-2">
          Steps are indicative. Google doesn’t report live progress, so these follow a typical
          test’s timing.
          {elapsed > limit - 20 && ` The test stops at ${limit} seconds.`}
        </p>

        <Button variant="outline" size="lg" className="mt-8" onClick={onCancel}>
          Cancel test
        </Button>
      </div>
    </section>
  )
}

/** The dial with its needle hunting back and forth, like a meter settling. */
function HuntingDial({ className }: { className?: string }) {
  const ticks = Array.from({ length: 21 }, (_, i) => -120 + i * 12)
  return (
    <svg viewBox="0 0 200 170" className={className} aria-hidden>
      <g stroke="var(--ink)" strokeLinecap="round">
        {ticks.map((deg, i) => {
          const major = i % 2 === 0
          const rad = ((deg - 90) * Math.PI) / 180
          const r1 = 80
          const r2 = major ? 70 : 75
          return (
            <line
              key={deg}
              x1={100 + r1 * Math.cos(rad)}
              y1={100 + r1 * Math.sin(rad)}
              x2={100 + r2 * Math.cos(rad)}
              y2={100 + r2 * Math.sin(rad)}
              strokeWidth={major ? 1.4 : 0.8}
              opacity={major ? 0.9 : 0.5}
            />
          )
        })}
      </g>
      <path
        d="M 23.8 144 A 88 88 0 1 1 176.2 144"
        fill="none"
        stroke="var(--signal)"
        strokeOpacity="0.35"
        strokeWidth="3"
        strokeDasharray="6 10"
        className="vl-trace"
      />
      <g className="vl-hunt" style={{ transformOrigin: '100px 100px' }}>
        <line
          x1="100"
          y1="112"
          x2="100"
          y2="28"
          stroke="var(--ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
      <circle cx="100" cy="100" r="7" fill="var(--ink)" />
      <circle cx="100" cy="100" r="2.4" fill="var(--plate)" />
      <rect x="66" y="122" width="68" height="34" rx="5" fill="var(--well)" />
      <g fill="var(--ink-2)">
        <circle className="vl-blink" cx="88" cy="139" r="2.6" style={{ animationDelay: '0ms' }} />
        <circle
          className="vl-blink"
          cx="100"
          cy="139"
          r="2.6"
          style={{ animationDelay: '180ms' }}
        />
        <circle
          className="vl-blink"
          cx="112"
          cy="139"
          r="2.6"
          style={{ animationDelay: '360ms' }}
        />
      </g>
    </svg>
  )
}
