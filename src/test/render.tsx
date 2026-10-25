import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { SettingsProvider } from '@/app/settings-context'
import { AnalysisProvider } from '@/features/analyze/analysis-context'

/** Render inside the app's providers and an in-memory router. */
export function renderWithApp(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  return render(
    <SettingsProvider>
      <AnalysisProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AnalysisProvider>
    </SettingsProvider>,
  )
}
