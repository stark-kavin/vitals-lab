import { ChevronDown, CircleCheck, Info, OctagonAlert, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { MarkdownLite } from '@/lib/markdown-lite'
import type { Audit } from '@/lib/psi-types'
import { rateAuditScore } from '@/lib/ratings'
import { cn } from '@/lib/utils'
import { DetailsRenderer } from './DetailsRenderer'

function AuditIcon({ audit }: { audit: Audit }) {
  const mode = audit.scoreDisplayMode
  if (
    mode === 'manual' ||
    mode === 'notApplicable' ||
    mode === 'informative' ||
    audit.score == null
  ) {
    return <Info className="size-[18px] text-ink-2" aria-label="Informational" />
  }
  const rating = rateAuditScore(audit.score)
  if (rating === 'good')
    return <CircleCheck className="size-[18px] text-good" aria-label="Passed" />
  if (rating === 'needs-work')
    return <TriangleAlert className="size-[18px] text-warn" aria-label="Needs work" />
  return <OctagonAlert className="size-[18px] text-poor" aria-label="Failed" />
}

export function AuditItem({
  audit,
  badge,
  tags,
  meter,
}: {
  audit: Audit
  badge?: string | null
  tags?: string[]
  /** 0-1: size of this audit's saving relative to the biggest one, drawn as a bar. */
  meter?: number
}) {
  // Details tables can be large; only render them once opened.
  const [open, setOpen] = useState(false)
  const display = audit.displayValue?.replace(/\u00a0/g, ' ')

  return (
    <li>
      <details className="group" onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary
          className={cn(
            'row-hover grid cursor-pointer list-none grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-1 rounded-control py-3 pr-2 pl-3 hover:bg-well [&::-webkit-details-marker]:hidden',
          )}
        >
          <span className="mt-0.5">
            <AuditIcon audit={audit} />
          </span>
          <span className="min-w-0">
            <MarkdownLite text={audit.title} className="text-ink" />
            {(display || (tags && tags.length > 0)) && (
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
                {display && <span>{display}</span>}
                {tags?.map((t) => (
                  <span
                    key={t}
                    className="num-narrow rounded-chip border border-rule px-1.5 text-[0.6875rem] leading-5"
                  >
                    {t}
                  </span>
                ))}
              </span>
            )}
            {meter != null && meter > 0 && (
              <span
                aria-hidden
                className="mt-2 block h-1 w-full max-w-sm overflow-hidden rounded-full bg-well"
              >
                <span
                  className="block h-full rounded-full bg-[linear-gradient(90deg,var(--signal),color-mix(in_oklab,var(--signal)_55%,var(--plate)))]"
                  style={{ width: `${Math.max(4, Math.round(meter * 100))}%` }}
                />
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            {badge && (
              <span className="num-narrow rounded-chip bg-well px-2 py-1 text-[0.75rem] whitespace-nowrap text-ink">
                {badge}
              </span>
            )}
            <ChevronDown
              aria-hidden
              className="size-4 text-ink-2 transition-transform duration-200 group-open:rotate-180"
            />
          </span>
        </summary>
        {open && (
          <div className="pr-2 pb-5 pl-9">
            {audit.description && (
              <p className="prose-lite max-w-[72ch] text-[0.9375rem] leading-relaxed text-ink-2">
                <MarkdownLite text={audit.description} />
              </p>
            )}
            {audit.errorMessage && (
              <p className="mt-2 text-sm text-poor">
                This audit failed to run: {audit.errorMessage}
              </p>
            )}
            <DetailsRenderer details={audit.details} />
          </div>
        )}
      </details>
    </li>
  )
}
