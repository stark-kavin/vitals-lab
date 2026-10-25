import { useEffect, useState } from 'react'
import { FILL } from '@/components/shared/rating-classes'
import type { CategoryId, Report } from '@/lib/psi-types'
import { categoryScore } from '@/lib/report-model'
import { rateScore } from '@/lib/ratings'
import { cn } from '@/lib/utils'
import { SECTION_META } from './sections'

const CATEGORY_SECTIONS: Record<string, CategoryId> = {
  scores: 'performance',
  'cat-accessibility': 'accessibility',
  'cat-best-practices': 'best-practices',
  'cat-seo': 'seo',
}

/** "On this page" list for the report rail; highlights the section being read. */
export function SectionNav({ report }: { report: Report }) {
  const [ids, setIds] = useState<string[]>([])
  const [active, setActive] = useState<string | null>(null)

  // Only list sections that actually rendered for this report.
  useEffect(() => {
    let io: IntersectionObserver | undefined
    // Wait a frame so the sections have mounted.
    const raf = requestAnimationFrame(() => {
      const present = Object.keys(SECTION_META).filter((id) => document.getElementById(id))
      setIds(present)
      if (typeof IntersectionObserver === 'undefined') return
      io = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting)
          const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
          if (top) setActive(top.target.id)
        },
        { rootMargin: '-15% 0px -70% 0px' },
      )
      present.forEach((id) => {
        const el = document.getElementById(id)
        if (el) io?.observe(el)
      })
    })
    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
    }
  }, [report])

  if (ids.length === 0) return null

  function go(id: string) {
    const target = document.getElementById(id)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    target.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  }

  return (
    <nav aria-label="On this page" className="hidden lg:block">
      <p className="font-label mb-2 text-sm text-ink-2">On this page</p>
      <ul className="space-y-0.5 border-l border-rule">
        {ids.map((id) => {
          const meta = SECTION_META[id]
          if (!meta) return null
          const Icon = meta.icon
          const cat = CATEGORY_SECTIONS[id]
          const rating = cat ? rateScore(categoryScore(report, cat)) : null
          const current = active === id
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => go(id)}
                aria-current={current ? 'location' : undefined}
                className={cn(
                  '-ml-px flex w-full items-center gap-2.5 border-l-2 py-1.5 pr-2 pl-3 text-left text-[0.9375rem] transition-colors',
                  current
                    ? 'border-signal text-ink'
                    : 'border-transparent text-ink-2 hover:border-edge hover:text-ink',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="flex-1">{meta.label}</span>
                {rating && <span aria-hidden className={cn('size-2 rounded-full', FILL[rating])} />}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
