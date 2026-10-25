import { ChevronDown, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'

/** A titled report section with an icon tile. `aside` sits to the right of the title on wide screens. */
export function Section({
  id,
  icon: Icon,
  title,
  intro,
  aside,
  children,
  className,
}: {
  id: string
  icon?: LucideIcon
  title: ReactNode
  intro?: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  const ref = useReveal<HTMLElement>()
  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn('scroll-mt-24', className)}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-start gap-3.5">
          {Icon && (
            <span className="icon-tile mt-1" aria-hidden>
              <Icon className="size-5" strokeWidth={1.9} />
            </span>
          )}
          <div className="min-w-0">
            <h2
              id={`${id}-title`}
              tabIndex={-1}
              className="font-display text-[1.75rem] outline-none sm:text-[2rem]"
            >
              {title}
            </h2>
            {intro && <div className="mt-1 max-w-[62ch] text-[0.9375rem] text-ink-2">{intro}</div>}
          </div>
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function Collapsible({
  summary,
  count,
  icon: Icon,
  children,
}: {
  summary: string
  count: number
  icon?: LucideIcon
  children: ReactNode
}) {
  if (count === 0) return null
  return (
    <details className="group mt-2 border-t border-rule">
      <summary className="font-label flex cursor-pointer list-none items-center justify-between gap-3 rounded-control px-2 py-3 text-ink-2 transition-colors hover:bg-well hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {Icon && <Icon className="size-4" aria-hidden />}
          {summary}
          <span className="num-narrow rounded-chip bg-well px-1.5 text-[0.75rem]">{count}</span>
        </span>
        <ChevronDown
          aria-hidden
          className="size-4 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="pb-2">{children}</div>
    </details>
  )
}
