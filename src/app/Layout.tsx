import { Moon, Sun, SunMoon } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useEffect, useRef } from 'react'
import { Wordmark } from '@/components/shared/Wordmark'
import type { Theme } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { useSettings } from './settings-context'

const NEXT_THEME: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
const THEME_ICON = { system: SunMoon, light: Sun, dark: Moon }
const THEME_LABEL = { system: 'Theme: match system', light: 'Theme: light', dark: 'Theme: dark' }

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'font-label relative rounded-control px-3 py-2 text-[0.9375rem] text-ink-2 no-underline transition-colors hover:bg-well hover:text-ink',
    isActive &&
      'text-ink after:absolute after:inset-x-3 after:-bottom-[13px] after:h-[3px] after:rounded-full after:bg-signal',
  )
}

export function Layout() {
  const { settings, updateSettings, persistent } = useSettings()
  const ThemeIcon = THEME_ICON[settings.theme]
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const first = useRef(true)

  // Move focus to the page on route change so keyboard and screen reader users land on new content.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          mainRef.current?.focus()
        }}
        className="sr-only z-50 rounded-control bg-signal px-3 py-2 text-signal-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className="border-b border-rule">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-3 px-4 sm:px-6">
          <NavLink to="/" className="rounded-control no-underline" aria-label="Vitals Lab home">
            <Wordmark />
          </NavLink>
          <nav aria-label="Main" className="ml-auto flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Analyze
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              Settings
            </NavLink>
            <button
              type="button"
              onClick={() => updateSettings({ theme: NEXT_THEME[settings.theme] })}
              className="ml-1 inline-flex size-10 items-center justify-center rounded-control text-ink-2 transition-colors hover:bg-well hover:text-ink"
              aria-label={`${THEME_LABEL[settings.theme]}. Switch theme`}
              title={THEME_LABEL[settings.theme]}
            >
              <ThemeIcon className="size-[18px]" aria-hidden />
            </button>
          </nav>
        </div>
      </header>

      {!persistent && (
        <p role="status" className="bg-warn-soft px-4 py-2 text-center text-sm text-ink">
          Your browser is blocking storage, so settings and history will reset when you close this
          tab.
        </p>
      )}

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="min-h-[calc(100dvh-4rem)] flex-1 outline-none"
      >
        <Outlet />
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-1 px-4 py-6 text-sm text-ink-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Runs in your browser. Tests are performed by Google PageSpeed Insights.</p>
          <p>No accounts, no tracking. Your key stays on this device.</p>
        </div>
      </footer>
    </div>
  )
}
