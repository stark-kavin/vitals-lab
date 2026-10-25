import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** A titled report section. `aside` sits to the right of the title on wide screens. */
export function Section({
  id,
  title,
  intro,
  aside,
  children,
  className,
}: {
  id: string
  title: ReactNode
  intro?: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-6', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="font-display text-[1.75rem] sm:text-[2rem]">
            {title}
          </h2>
          {intro && <div className="mt-1 max-w-[62ch] text-[0.9375rem] text-ink-2">{intro}</div>}
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
  children,
}: {
  summary: string
  count: number
  children: ReactNode
}) {
  if (count === 0) return null
  return (
    <details className="group mt-2 border-t border-rule">
      <summary className="font-label flex cursor-pointer list-none items-center justify-between gap-3 rounded-control px-2 py-3 text-ink-2 hover:bg-well hover:text-ink [&::-webkit-details-marker]:hidden">
        <span>
          {summary} <span className="num-narrow">({count})</span>
        </span>
        <span
          aria-hidden
          className="text-lg leading-none transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="pb-2">{children}</div>
    </details>
  )
}
