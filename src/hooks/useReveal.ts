import { useEffect, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion'

/**
 * Fades an element up the first time it scrolls into view. Content stays
 * visible when IntersectionObserver is missing or motion is reduced, and
 * anything already on screen at mount is left alone so nothing flickers.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced || typeof IntersectionObserver === 'undefined') return
    if (el.getBoundingClientRect().top < window.innerHeight) return

    el.classList.add('reveal-pending')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          el.classList.add('reveal-in')
          el.classList.remove('reveal-pending')
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      el.classList.remove('reveal-pending')
    }
  }, [reduced])

  return ref
}
