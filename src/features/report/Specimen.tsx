import { Monitor, Smartphone } from 'lucide-react'
import type { ReactNode } from 'react'
import { displayUrl, formatDateTime } from '@/lib/format'
import type { Report } from '@/lib/psi-types'
import { cn } from '@/lib/utils'

function screenshotOf(report: Report): string | null {
  const data = report.audits['final-screenshot']?.details?.data
  return typeof data === 'string' && data.startsWith('data:image/') ? data : null
}

/** The tested page in a simple device bezel, plus the test's particulars. */
export function Specimen({ report, children }: { report: Report; children?: ReactNode }) {
  const shot = screenshotOf(report)
  const mobile = report.strategy === 'mobile'
  const redirected =
    report.requestedUrl &&
    report.finalUrl &&
    displayUrl(report.requestedUrl) !== displayUrl(report.finalUrl)

  return (
    <div className="grid grid-cols-[88px_1fr] gap-x-4 gap-y-6 sm:grid-cols-[120px_1fr] lg:grid-cols-1">
      <div
        className={cn(
          'overflow-hidden border-[5px] border-[var(--bezel)] bg-[var(--bezel)]',
          mobile ? 'rounded-[16px] lg:mx-auto lg:w-[180px]' : 'rounded-[8px] lg:w-full',
        )}
      >
        {!mobile && (
          <div aria-hidden className="flex gap-1 bg-[var(--bezel)] px-1 pb-1">
            <span className="size-1.5 rounded-full bg-[#e3e5e0]/50" />
            <span className="size-1.5 rounded-full bg-[#e3e5e0]/50" />
            <span className="size-1.5 rounded-full bg-[#e3e5e0]/50" />
          </div>
        )}
        {shot ? (
          <img
            src={shot}
            alt={`Screenshot of ${displayUrl(report.finalUrl)} at the end of the test`}
            className={cn(
              'block w-full bg-plate object-cover object-top',
              mobile ? 'aspect-[9/17]' : 'aspect-[16/11]',
            )}
          />
        ) : (
          <div
            className={cn(
              'flex items-center justify-center bg-well p-2 text-center text-[0.75rem] text-ink-2',
              mobile ? 'aspect-[9/17]' : 'aspect-[16/11]',
            )}
          >
            No screenshot
          </div>
        )}
      </div>

      <dl className="grid min-w-0 grid-cols-[minmax(0,auto)_minmax(0,auto)] justify-start gap-x-6 gap-y-3 text-[0.9375rem]">
        <div className="col-span-2">
          <dt className="text-sm text-ink-2">Tested page</dt>
          <dd className="font-medium [overflow-wrap:anywhere] text-ink">
            {displayUrl(report.finalUrl)}
          </dd>
          {redirected && (
            <dd className="mt-0.5 text-sm [overflow-wrap:anywhere] text-ink-2">
              Redirected from {displayUrl(report.requestedUrl)}
            </dd>
          )}
        </div>
        <div className="col-span-2">
          <dt className="text-sm text-ink-2">Device</dt>
          <dd className="flex items-center gap-1.5 text-ink">
            {mobile ? (
              <Smartphone className="size-4" aria-hidden />
            ) : (
              <Monitor className="size-4" aria-hidden />
            )}
            {mobile ? 'Mobile, slow 4G' : 'Desktop, fast connection'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-2">Tested</dt>
          <dd className="text-ink">
            {report.fetchTime ? (
              <time dateTime={report.fetchTime}>{formatDateTime(report.fetchTime)}</time>
            ) : (
              '–'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-2">Lighthouse</dt>
          <dd className="num-narrow text-ink">{report.lighthouseVersion ?? '–'}</dd>
        </div>
      </dl>

      {children && <div className="col-span-2 lg:col-span-1">{children}</div>}
    </div>
  )
}
