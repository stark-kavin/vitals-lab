import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useSettings } from '@/app/settings-context'
import { Button } from '@/components/ui/button'
import { normalizeUrl } from '@/lib/url'
import { useAnalysis } from '../analyze/analysis-context'
import { ErrorView } from '../analyze/ErrorView'
import { LoadingView } from '../analyze/LoadingView'
import { parseStrategyParam, sameRequest, SAMPLE_URL, strategiesFor } from '../analyze/run'
import { ReportView } from './ReportView'

export default function ReportPage() {
  const [params] = useSearchParams()
  const { state, restored, start, cancel, loadSample } = useAnalysis()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const isSampleRoute = params.get('sample') === '1'
  const urlParam = params.get('url')
  const strategyParam = parseStrategyParam(params.get('strategy')) ?? settings.strategy
  const normalized = urlParam ? normalizeUrl(urlParam) : null
  const linkKey = isSampleRoute
    ? 'sample'
    : normalized?.ok
      ? `${normalized.url}|${strategyParam}`
      : null

  // Act once per distinct link, so StrictMode and re-renders don't trigger duplicate runs.
  const handled = useRef<string | null>(null)
  useEffect(() => {
    if (!restored || !linkKey || handled.current === linkKey) return
    handled.current = linkKey
    if (isSampleRoute) {
      if (!(state.status === 'done' && state.isSample)) void loadSample()
      return
    }
    if (!normalized?.ok) return
    const wanted = { url: normalized.url, strategies: strategiesFor(strategyParam) }
    const matches = state.status !== 'idle' && sameRequest(state.request, wanted)
    if (!matches) start({ ...wanted, categories: settings.categories, locale: settings.locale })
  })

  const editAddress = (url: string) =>
    navigate('/', { state: { url: url === SAMPLE_URL ? '' : url } })

  if (normalized && !normalized.ok) {
    return (
      <Notice title="This link has an address we can’t test" body={normalized.error}>
        <Button asChild size="lg">
          <Link to="/">Test another page</Link>
        </Button>
      </Notice>
    )
  }

  if (!restored) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 py-16 text-ink-2 sm:px-6" role="status">
        Restoring your last report…
      </div>
    )
  }

  switch (state.status) {
    case 'running':
      return (
        <LoadingView
          key={state.startedAt}
          url={state.request.url}
          strategies={state.request.strategies}
          startedAt={state.startedAt}
          onCancel={cancel}
        />
      )
    case 'error':
      return (
        <ErrorView
          key={`${state.request.url}-${state.error.kind}`}
          error={state.error}
          url={state.request.url}
          onRetry={() => start(state.request)}
          onEdit={() => editAddress(state.request.url)}
        />
      )
    case 'done':
      return (
        <ReportView
          key={`${state.request.url}|${Object.keys(state.reports).join(',')}|${state.isSample}`}
          request={state.request}
          reports={state.reports}
          errors={state.errors}
          isSample={state.isSample}
          onRerun={() =>
            start({
              ...state.request,
              categories: state.request.categories.length
                ? state.request.categories
                : settings.categories,
              locale: settings.locale,
            })
          }
          onEdit={() => editAddress(state.request.url)}
        />
      )
    case 'idle':
      if (linkKey) return null
      return (
        <Notice
          title="No report open"
          body="Run a test from the home page, or open the sample report to see what a finished report looks like."
        >
          <Button asChild size="lg">
            <Link to="/">Test a page</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/report?sample=1">View sample report</Link>
          </Button>
        </Notice>
      )
  }
}

function Notice({
  title,
  body,
  children,
}: {
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 md:py-24">
      <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-[56ch] text-lg text-ink-2">{body}</p>
      <div className="mt-8 flex flex-wrap gap-3">{children}</div>
    </div>
  )
}
