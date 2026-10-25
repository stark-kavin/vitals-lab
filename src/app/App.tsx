import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { AnalysisProvider } from '@/features/analyze/analysis-context'
import { HomePage } from '@/features/home/HomePage'
import { Layout } from './Layout'
import { SettingsProvider } from './settings-context'

const ReportPage = lazy(() => import('@/features/report/ReportPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const NotFoundPage = lazy(() => import('@/features/NotFoundPage'))

function PageFallback() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-16 text-ink-2 sm:px-6" role="status">
      Loading…
    </div>
  )
}

export function App() {
  return (
    <SettingsProvider>
      <AnalysisProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route
                path="report"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ReportPage />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <SettingsPage />
                  </Suspense>
                }
              />
              <Route
                path="*"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <NotFoundPage />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </HashRouter>
      </AnalysisProvider>
    </SettingsProvider>
  )
}
