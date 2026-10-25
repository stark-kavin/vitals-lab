import { FileText } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { useSettings } from '@/app/settings-context'
import { Logbook } from '@/components/history/Logbook'
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
    <div className="mx-auto max-w-[1240px] px-4 pt-10 pb-16 sm:px-6 md:pt-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div>
          <h1 className="font-display max-w-[14ch] text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem]">
            Put a page on the bench.
          </h1>
          <p className="mt-4 max-w-[54ch] text-lg text-ink-2">
            Google loads it on a simulated phone or desktop and measures everything. We turn the
            readings into plain English and point at the fixes that matter most.
          </p>

          {running && (
            <p
              role="status"
              className="mt-6 flex flex-wrap items-center gap-3 rounded-control bg-signal-soft px-4 py-3 text-ink"
            >
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

          <div className="mt-8">
            <AnalyzeForm initialUrl={prefill} running={running} onSubmit={run} onCancel={cancel} />
          </div>

          <div className="mt-10 border-t border-rule pt-6">
            <dl className="grid gap-5 text-[0.9375rem] sm:grid-cols-2">
              <div>
                <dt className="font-label text-ink">Lab test</dt>
                <dd className="mt-1 text-ink-2">
                  One controlled visit, run by Google right now. Takes 10 to 60 seconds. Good for
                  finding causes.
                </dd>
              </div>
              <div>
                <dt className="font-label text-ink">Real-user data</dt>
                <dd className="mt-1 text-ink-2">
                  How actual Chrome visitors experienced the page over the last 28 days, when
                  there’s enough traffic.
                </dd>
              </div>
            </dl>
            <Button variant="outline" className="mt-6" onClick={() => navigate('/report?sample=1')}>
              <FileText aria-hidden />
              View sample report
            </Button>
            <p className="mt-2 text-sm text-ink-2">Uses a saved result. No quota, works offline.</p>
          </div>
        </div>

        <aside className="lg:pt-3">
          <Logbook onRerun={rerun} disabled={running} />
        </aside>
      </div>
    </div>
  )
}
