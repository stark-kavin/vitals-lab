import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import sample from '@/fixtures/sample-report.json'
import { parsePsiResponse } from '@/lib/psi-client'
import { renderWithApp } from '@/test/render'
import { ReportView } from './ReportView'

const mobile = parsePsiResponse(sample, 'mobile')
const request = {
  url: mobile.requestedUrl,
  strategies: ['mobile' as const],
  categories: [],
  locale: 'en',
}

function renderReport(extra: Partial<Parameters<typeof ReportView>[0]> = {}) {
  return renderWithApp(
    <ReportView
      request={request}
      reports={{ mobile }}
      errors={{}}
      isSample
      onRerun={() => {}}
      onEdit={() => {}}
      {...extra}
    />,
  )
}

describe('ReportView with the sample fixture', () => {
  it('renders the header, summary and every section', () => {
    renderReport()
    expect(
      screen.getByRole('heading', { level: 1, name: 'northwind-pantry.example' }),
    ).toBeVisible()
    expect(screen.getByText(/loads slowly on a mid-range phone/)).toBeVisible()
    for (const name of [
      'Scores',
      'Real visitors',
      'Lab test',
      'How it loaded',
      'What to fix first',
      'Accessibility',
      'Best Practices',
      'SEO',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
    expect(screen.getByText(/Sample report/)).toBeVisible()
  })

  it('labels gauges with text, not color alone', () => {
    renderReport()
    expect(screen.getByRole('link', { name: /Performance: 32/ })).toBeInTheDocument()
    expect(screen.getAllByText('Poor').length).toBeGreaterThan(0)
  })

  it('shows field data with a URL / origin toggle', async () => {
    const user = userEvent.setup()
    renderReport()
    const field = screen.getByRole('region', { name: 'Real visitors' })
    expect(within(field).getByText('3.2 s')).toBeVisible()
    await user.click(within(field).getByRole('radio', { name: 'Whole origin' }))
    expect(within(field).getByText('2.4 s')).toBeVisible()
  })

  it('shows an empty state when there is no field data', () => {
    const noField = { ...mobile, loadingExperience: null, originLoadingExperience: null }
    renderReport({ reports: { mobile: noField } })
    expect(screen.getByText('Not enough real-user traffic for this URL.')).toBeVisible()
  })

  it('filters opportunities by metric and expands details', async () => {
    const user = userEvent.setup()
    renderReport()
    const section = screen.getByRole('region', { name: 'What to fix first' })
    const all = within(section).getAllByRole('listitem').length
    await user.click(within(section).getByRole('radio', { name: /^CLS/ }))
    const cls = within(section).getAllByRole('listitem').length
    expect(cls).toBeLessThan(all)

    await user.click(within(section).getByText('Image elements do not have explicit'))
    expect(await within(section).findByRole('table')).toBeInTheDocument()
  })

  it('collapses passed audits with a count', () => {
    renderReport()
    const a11y = screen.getByRole('region', { name: 'Accessibility' })
    expect(within(a11y).getByText('Passed audits')).toBeInTheDocument()
    expect(within(a11y).getByText('15')).toBeInTheDocument()
  })

  it('shows a compare view when both strategies ran', async () => {
    const user = userEvent.setup()
    const desktop = parsePsiResponse(sample, 'desktop')
    renderReport({ reports: { mobile, desktop }, isSample: false })
    await user.click(screen.getByRole('radio', { name: /Compare/ }))
    expect(screen.getByRole('heading', { name: 'Mobile and desktop side by side' })).toBeVisible()
    expect(screen.getByRole('table', { name: /mobile versus desktop/ })).toBeInTheDocument()
  })
})
