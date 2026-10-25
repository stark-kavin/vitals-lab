import {
  Activity,
  BookOpen,
  CodeXml,
  KeyRound,
  Moon,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  SunMoon,
} from 'lucide-react'
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
    'font-label relative inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-[0.9375rem] text-ink-2 no-underline transition-colors hover:bg-well hover:text-ink',
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
      <header className="sticky top-0 z-40 border-b border-rule bg-[color-mix(in_oklab,var(--panel)_82%,transparent)] backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-3 px-4 sm:px-6">
          <NavLink to="/" className="rounded-control no-underline" aria-label="Vitals Lab home">
            <Wordmark />
          </NavLink>
          <nav aria-label="Main" className="ml-auto flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              <Activity className="hidden size-4 sm:block" aria-hidden />
              <span>Analyze</span>
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              <SlidersHorizontal className="hidden size-4 sm:block" aria-hidden />
              <span>Settings</span>
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

      <footer className="border-t border-rule bg-plate/60">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-sm text-sm text-ink-2">
              Runs in your browser. Tests are performed by Google PageSpeed Insights; the readings
              are explained here in plain English.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2 text-[0.8125rem] text-ink-2">
              {[
                { icon: ShieldCheck, text: 'No tracking' },
                { icon: KeyRound, text: 'Key stays on this device' },
                { icon: Server, text: 'No backend' },
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-plate px-2.5 py-1"
                >
                  <Icon className="size-3.5 text-signal" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-label text-ink">App</p>
              <ul className="mt-2 space-y-1.5 text-ink-2">
                <li>
                  <NavLink to="/" className="text-ink-2 no-underline hover:text-ink">
                    Test a page
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/report?sample=1" className="text-ink-2 no-underline hover:text-ink">
                    Sample report
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/settings" className="text-ink-2 no-underline hover:text-ink">
                    Settings
                  </NavLink>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-label text-ink">Resources</p>
              <ul className="mt-2 space-y-1.5">
                <li>
                  <a
                    href="https://github.com/stark-kavin/vitals-lab"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-ink-2 no-underline hover:text-ink"
                  >
                    <CodeXml className="size-3.5" aria-hidden /> Source code
                  </a>
                </li>
                <li>
                  <a
                    href="https://developers.google.com/speed/docs/insights/v5/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-ink-2 no-underline hover:text-ink"
                  >
                    <BookOpen className="size-3.5" aria-hidden /> About PageSpeed Insights
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </footer>
    </div>
  )
}
