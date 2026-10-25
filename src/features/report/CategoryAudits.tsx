import { useMemo } from 'react'
import { RatingMark } from '@/components/shared/RatingBadge'
import { ratingTextClass } from '@/components/shared/rating-classes'
import { MarkdownLite } from '@/lib/markdown-lite'
import { CATEGORY_INFO } from '@/lib/metric-info'
import type { CategoryId, Report } from '@/lib/psi-types'
import { categoryScore, getCategory, groupCategoryAudits } from '@/lib/report-model'
import { rateScore } from '@/lib/ratings'
import { AuditItem } from './AuditItem'
import { Collapsible, Section } from './Section'
import { SECTION_META } from './sections'
import { CircleCheck, CircleMinus, Hand } from 'lucide-react'

export function CategoryAudits({ report, id }: { report: Report; id: CategoryId }) {
  const category = getCategory(report, id)
  const grouped = useMemo(() => groupCategoryAudits(report, id), [report, id])
  if (!category) return null

  const score = categoryScore(report, id)
  const rating = rateScore(score)

  return (
    <Section
      id={`cat-${id}`}
      icon={SECTION_META[`cat-${id}`]?.icon}
      title={category.title}
      intro={CATEGORY_INFO[id]?.blurb}
      aside={
        <div className="flex items-baseline gap-3">
          <span className={`num text-3xl ${ratingTextClass(rating)}`}>{score ?? '–'}</span>
          {rating && <RatingMark rating={rating} className="text-sm" />}
        </div>
      }
    >
      {grouped.failedCount === 0 ? (
        <p className="rounded-plate border border-dashed border-edge px-5 py-6 text-ink-2">
          Every automated check in this category passed.
        </p>
      ) : (
        <div className="space-y-6">
          {grouped.failed.map((g) => (
            <div key={g.id}>
              <h3 className="font-label text-lg text-ink">
                {g.title} <span className="num-narrow text-sm text-ink-2">{g.audits.length}</span>
              </h3>
              {g.description && (
                <p className="mt-0.5 max-w-[72ch] text-sm text-ink-2">
                  <MarkdownLite text={g.description} />
                </p>
              )}
              <ul className="mt-2 divide-y divide-rule border-y border-rule">
                {g.audits.map((a) => (
                  <AuditItem key={a.id} audit={a} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Collapsible summary="Passed audits" count={grouped.passed.length} icon={CircleCheck}>
          <ul className="divide-y divide-rule">
            {grouped.passed.map((a) => (
              <AuditItem key={a.id} audit={a} />
            ))}
          </ul>
        </Collapsible>
        <Collapsible summary="Check these by hand" count={grouped.manual.length} icon={Hand}>
          {category.manualDescription && (
            <p className="px-2 pb-2 text-sm text-ink-2">
              <MarkdownLite text={category.manualDescription} />
            </p>
          )}
          <ul className="divide-y divide-rule">
            {grouped.manual.map((a) => (
              <AuditItem key={a.id} audit={a} />
            ))}
          </ul>
        </Collapsible>
        <Collapsible
          summary="Not applicable to this page"
          count={grouped.notApplicable.length}
          icon={CircleMinus}
        >
          <ul className="divide-y divide-rule">
            {grouped.notApplicable.map((a) => (
              <AuditItem key={a.id} audit={a} />
            ))}
          </ul>
        </Collapsible>
      </div>
    </Section>
  )
}
