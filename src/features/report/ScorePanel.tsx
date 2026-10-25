import { Dial } from '@/components/gauge/Dial'
import { InfoPopover } from '@/components/shared/InfoPopover'
import { CATEGORY_INFO } from '@/lib/metric-info'
import type { Report } from '@/lib/psi-types'
import { toScore100 } from '@/lib/ratings'

export function ScorePanel({ report }: { report: Report }) {
  const cats = report.categories
  if (cats.length === 0) return null

  return (
    <section aria-labelledby="scores-title" className="plate px-3 pt-5 pb-4 sm:px-5">
      <div className="flex items-center gap-1 px-2">
        <h2 id="scores-title" className="font-label text-ink">
          Scores
        </h2>
        <InfoPopover title="How scores work" label="How scores work">
          <p>Each category is scored 0 to 100 from this single lab test.</p>
          <p>90 and above is good, 50 to 89 needs work, below 50 is poor.</p>
          <p>
            Performance is a weighted blend of the lab metrics. The other categories are the share
            of automated checks that passed, weighted by importance.
          </p>
        </InfoPopover>
      </div>
      <div
        className={`mt-2 grid grid-cols-2 gap-y-6 ${cats.length >= 4 ? 'md:grid-cols-4' : cats.length === 3 ? 'md:grid-cols-3' : ''}`}
      >
        {cats.map((c, i) => (
          <div
            key={c.id}
            className="flex flex-col items-center px-2 md:border-l md:border-rule md:first:border-l-0"
          >
            <a
              href={`#cat-${c.id === 'performance' ? 'perf' : c.id}`}
              onClick={(e) => {
                // HashRouter owns the URL hash, so scroll manually.
                e.preventDefault()
                const target = document.getElementById(
                  c.id === 'performance' ? 'lab' : `cat-${c.id}`,
                )
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                target?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
              }}
              className="w-full rounded-control text-ink no-underline transition-colors hover:bg-well"
              title={CATEGORY_INFO[c.id]?.blurb}
            >
              <Dial score={toScore100(c.score)} label={c.title} delay={i * 0.08} />
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
