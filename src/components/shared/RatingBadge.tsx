import { CircleCheck, OctagonAlert, TriangleAlert } from 'lucide-react'
import { RATING_LABEL, type Rating } from '@/lib/ratings'
import { cn } from '@/lib/utils'
import { SOFT, TEXT } from './rating-classes'

const ICON = { good: CircleCheck, 'needs-work': TriangleAlert, poor: OctagonAlert } as const

/** Icon + label in the rating color. Never color alone. */
export function RatingMark({
  rating,
  label,
  className,
}: {
  rating: Rating
  label?: string
  className?: string
}) {
  const Icon = ICON[rating]
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-medium', TEXT[rating], className)}>
      <Icon aria-hidden className="size-[1.05em] shrink-0" strokeWidth={2.25} />
      {label ?? RATING_LABEL[rating]}
    </span>
  )
}

/** Compact tinted badge for lists and tables. */
export function RatingBadge({ rating, className }: { rating: Rating | null; className?: string }) {
  if (!rating) return <span className="text-sm text-ink-2">Not rated</span>
  return (
    <RatingMark
      rating={rating}
      className={cn(
        'rounded-chip px-1.5 py-0.5 text-[0.8125rem] leading-none',
        SOFT[rating],
        className,
      )}
    />
  )
}
