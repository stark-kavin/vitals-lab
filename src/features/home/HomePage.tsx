import {
  ChevronRight,
  FileText,
  FlaskConical,
  LoaderCircle,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useSettings } from '@/app/settings-context'
import { Logbook } from '@/components/history/Logbook'
import { HeroInstrument } from '@/components/shared/HeroInstrument'
import { Button } from '@/components/ui/button'
import { displayUrl } from '@/lib/format'
import type { Strategy } from '@/lib/psi-types'
import { useAnalysis } from '../analyze/analysis-context'
import { AnalyzeForm } from '../analyze/AnalyzeForm'
import { reportPath, strategyParamOf, type RunRequest, type StrategyParam } from '../analyze/run'

export function HomePage() {
  const { state, start, cancel } = useAnalysis()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as { url?: string } | null)?.url

  const running = state.status === 'running'

  function run(request: RunRequest, strategy: StrategyParam) {
    start(request)
    navigate(reportPath(request.url, strategy))
  }

  function rerun(url: string, strategy: Strategy) {
    run(
      { url, strategies: [strategy], categories: settings.categories, locale: settings.locale },
      strategy,
    )
  }

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-10 pb-20 sm:px-6 md:pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-14">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-rule bg-plate px-3 py-1 text-sm text-ink-2 shadow-[var(--shadow-plate)]">
            <Sparkles className="size-3.5 text-signal" aria-hidden />
            Powered by Google PageSpeed Insights
          </p>
          <h1 className="font-display mt-5 max-w-[14ch] text-[2.75rem] sm:text-[3.75rem] lg:text-[4.25rem]">
            Put a page on the bench.
          </h1>
          <p className="mt-4 max-w-[52ch] text-lg text-ink-2">
            Google loads it on a simulated phone or desktop and measures everything. We turn the
            readings into plain English and point at the fixes that matter most.
          </p>

          {running && (
            <p
              role="status"
              className="mt-6 flex flex-wrap items-center gap-3 rounded-control bg-signal-soft px-4 py-3 text-ink"
            >
              <LoaderCircle className="size-4 animate-spin text-signal" aria-hidden />
              Testing {displayUrl(state.request.url)} now.
              <Button
                variant="link"
                onClick={() =>
                  navigate(reportPath(state.request.url, strategyParamOf(state.request.strategies)))
                }
              >
                Watch progress
              </Button>
            </p>
          )}

          <div className="plate mt-8 p-5 sm:p-6">
            <AnalyzeForm initialUrl={prefill} running={running} onSubmit={run} onCancel={cancel} />
          </div>
        </div>

        <div className="relative hidden md:block">
          <HeroInstrument className="mx-auto w-full max-w-[520px] drop-shadow-[0_24px_40px_rgb(20_26_30/0.18)]" />
        </div>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
        <Feature icon={FlaskConical} title="Lab test">
          One controlled visit, run by Google right now. Takes 10 to 60 seconds. Good for finding
          causes.
        </Feature>
        <Feature icon={Users} title="Real-user data">
          How actual Chrome visitors experienced the page over the last 28 days, when there’s enough
          traffic.
        </Feature>
        <button
          type="button"
          onClick={() => navigate('/report?sample=1')}
          className="plate lift group flex items-start gap-4 p-5 text-left"
        >
          <span className="icon-tile bg-signal bg-none text-signal-ink" aria-hidden>
            <FileText className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="font-label flex items-center gap-1.5 text-[1.0625rem] text-ink">
              View sample report
              <ChevronRight
                className="size-4 text-ink-2 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
            <span className="mt-1 block text-[0.9375rem] text-ink-2">
              A full saved result. No quota used, works offline.
            </span>
          </span>
        </button>
      </div>

      <div className="plate mt-14 p-5 sm:p-7">
        <Logbook onRerun={rerun} disabled={running} />
      </div>
    </div>
  )
}

function Feature({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-4 rounded-plate p-5">
      <span className="icon-tile" aria-hidden>
        <Icon className="size-5" strokeWidth={1.9} />
      </span>
      <div>
        <h2 className="font-label text-[1.0625rem] text-ink">{title}</h2>
        <p className="mt-1 text-[0.9375rem] text-ink-2">{children}</p>
      </div>
    </div>
  )
}
