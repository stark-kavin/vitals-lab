import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithApp } from '@/test/render'
import { AnalyzeForm } from './AnalyzeForm'

function setup(running = false) {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  renderWithApp(<AnalyzeForm running={running} onSubmit={onSubmit} onCancel={onCancel} />)
  return { onSubmit, onCancel, user: userEvent.setup() }
}

describe('AnalyzeForm', () => {
  it('shows an inline error for private hosts and does not submit', async () => {
    const { onSubmit, user } = setup()
    const input = screen.getByLabelText('Page address')
    await user.type(input, 'localhost:3000{Enter}')
    expect(
      screen.getByText('PageSpeed Insights can only test publicly reachable sites.'),
    ).toBeVisible()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('asks for an address when empty', async () => {
    const { onSubmit, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Analyze' }))
    expect(screen.getByText(/Enter a web address/)).toBeVisible()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('normalises the URL and submits the chosen strategy and checks', async () => {
    const { onSubmit, user } = setup()
    await user.type(screen.getByLabelText('Page address'), 'example.com/shop')
    await user.click(screen.getByRole('radio', { name: /Both/ }))
    await user.click(screen.getByRole('button', { name: /^SEO/ }))
    await user.click(screen.getByRole('button', { name: 'Analyze' }))
    expect(onSubmit).toHaveBeenCalledWith(
      {
        url: 'https://example.com/shop',
        strategies: ['mobile', 'desktop'],
        categories: ['performance', 'accessibility', 'best-practices'],
        locale: 'en',
      },
      'both',
    )
  })

  it('clears the error as the user edits', async () => {
    const { user } = setup()
    const input = screen.getByLabelText('Page address')
    await user.type(input, 'ftp://x.com{Enter}')
    expect(screen.getByText(/publicly reachable/)).toBeVisible()
    await user.type(input, 'a')
    expect(screen.queryByText(/publicly reachable/)).toBeNull()
  })

  it('offers Cancel while running', async () => {
    const { onCancel, user } = setup(true)
    expect(screen.getByRole('button', { name: 'Testing…' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows the shared-quota notice without a key', () => {
    setup()
    expect(screen.getByText(/No key: shared quota/)).toBeVisible()
  })
})
