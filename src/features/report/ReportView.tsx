import { FlaskConical, Monitor, Smartphone, SplitSquareHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { displayUrl } from '@/lib/format'
import type { PsiError } from '@/lib/psi-client'
import { STRATEGIES, type CategoryId, type Report, type Strategy } from '@/lib/psi-types'
import { summarize } from '@/lib/report-model'
import { ErrorView } from '../analyze/ErrorView'
import { strategyParamOf, type RunRequest } from '../analyze/run'
import { CategoryAudits } from './CategoryAudits'
import { CompareView } from './CompareView'
import { FieldData } from './FieldData'
import { Filmstrip } from './Filmstrip'
import { LabMetrics } from './LabMetrics'
import { Opportunities } from './Opportunities'
import { ReportActions } from './ReportActions'
import { ScorePanel } from './ScorePanel'
import { Specimen } from './Specimen'

type View = Strategy | 'compare'
const OTHER_CATEGORIES: CategoryId[] = ['accessibility', 'best-practices', 'seo']

export function ReportView({
  request,
  reports,
  errors,
  isSample,
  onRerun,
  onEdit,
}: {
  request: RunRequest
  reports: Partial<Record<Strategy, Report>>
  errors: Partial<Record<Strategy, PsiError>>
  isSample: boolean
  onRerun: () => void
  onEdit: () => void
}) {
  const available = STRATEGIES.filter((s) => reports[s])
  const [view, setView] = useState<View>(available[0] ?? 'mobile')
  const failed = STRATEGIES.filter((s) => errors[s])
  const mobile = reports.mobile
  const desktop = reports.desktop
  const current = view === 'compare' ? undefined : reports[view]

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-8 pb-20 sm:px-6 md:pt-12">
      {isSample && (
        <p className="mb-8 flex items-start gap-3 rounded-control bg-signal-soft px-4 py-3 text-[0.9375rem] text-ink">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Sample report: a saved result for a fictional shop with deliberately slow pages. Nothing
            was sent to Google and no quota was used.
          </span>
        </p>
      )}

      {available.length > 1 && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as View)}
            aria-label="Report view"
          >
            <ToggleGroupItem value="mobile">
              <Smartphone aria-hidden /> Mobile
            </ToggleGroupItem>
            <ToggleGroupItem value="desktop">
              <Monitor aria-hidden /> Desktop
            </ToggleGroupItem>
            <ToggleGroupItem value="compare">
              <SplitSquareHorizontal aria-hidden /> Compare
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {failed.length > 0 && (
        <div className="mb-8 space-y-3">
          {failed.map((s) => {
            const e = errors[s]
            return e ? (
              <ErrorView
                key={s}
                compact
                error={
                  {
                    ...e,
                    message: e.message,
                    title: `${s === 'mobile' ? 'Mobile' : 'Desktop'} test failed: ${e.title}`,
                  } as PsiError
                }
                url={request.url}
                onRetry={onRerun}
                onEdit={onEdit}
              />
            ) : null
          })}
        </div>
      )}

      {view === 'compare' && mobile && desktop ? (
        <CompareView mobile={mobile} desktop={desktop} />
      ) : current ? (
        <SingleReport
          key={current.strategy}
          report={current}
          isSample={isSample}
          onRerun={onRerun}
          shareUrl={request.url}
          shareStrategy={strategyParamOf(available)}
        />
      ) : null}
    </div>
  )
}

function SingleReport({
  report,
  isSample,
  onRerun,
  shareUrl,
  shareStrategy,
}: {
  report: Report
  isSample: boolean
  onRerun: () => void
  shareUrl: string
  shareStrategy: ReturnType<typeof strategyParamOf>
}) {
  const summary = useMemo(() => summarize(report), [report])

  return (
    <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-14">
      <aside aria-label="Test details" className="lg:sticky lg:top-6 lg:self-start">
        <Specimen report={report}>
          <ReportActions
            report={report}
            isSample={isSample}
            onRerun={onRerun}
            shareUrl={isSample ? report.requestedUrl : shareUrl}
            shareStrategy={shareStrategy}
          />
        </Specimen>
      </aside>

      <div className="min-w-0 space-y-14">
        <header>
          <p className="text-ink-2">
            {report.strategy === 'mobile' ? 'Mobile' : 'Desktop'} report for
          </p>
          <h1 className="font-display mt-1 text-[2.25rem] [overflow-wrap:anywhere] sm:text-5xl">
            {splitUrl(report.finalUrl).host}
          </h1>
          {splitUrl(report.finalUrl).rest && (
            <p className="mt-1 max-w-[62ch] [overflow-wrap:anywhere] text-ink-2">
              {splitUrl(report.finalUrl).rest}
            </p>
          )}
          {summary.length > 0 && (
            <div className="mt-5 max-w-[62ch] space-y-2 text-lg leading-relaxed text-ink sm:text-xl">
              {summary.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
        </header>

        <ScorePanel report={report} />
        <FieldData report={report} />
        <LabMetrics report={report} />
        <Filmstrip report={report} />
        <Opportunities report={report} />
        {OTHER_CATEGORIES.map((id) => (
          <CategoryAudits key={id} report={report} id={id} />
        ))}
      </div>
    </div>
  )
}

/** Heading shows the host; the path and query go on a quieter line below. */
function splitUrl(url: string): { host: string; rest: string } {
  try {
    const u = new URL(url)
    const rest = `${u.pathname === '/' ? '' : u.pathname}${u.search}`
    return { host: u.host, rest }
  } catch {
    return { host: displayUrl(url), rest: '' }
  }
}
