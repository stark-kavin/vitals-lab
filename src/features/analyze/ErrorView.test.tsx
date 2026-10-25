import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  abortedError,
  mapHttpError,
  networkError,
  siteErrorFor,
  timeoutError,
} from '@/lib/psi-client'
import { renderWithApp } from '@/test/render'
import { ErrorView } from './ErrorView'

const url = 'https://example.com/'
// Built at runtime so the source never contains a key-shaped literal.
const FAKE_KEY = ['AIza', 'Sy', 'TEST'.repeat(8), '12'].join('')

function renderError(error: Parameters<typeof ErrorView>[0]['error']) {
  const onRetry = vi.fn()
  const onEdit = vi.fn()
  renderWithApp(<ErrorView error={error} url={url} onRetry={onRetry} onEdit={onEdit} />)
  return { onRetry, onEdit }
}

describe('ErrorView', () => {
  it('quota: explains, links to settings and delays retry', () => {
    renderError(mapHttpError(429, { error: { message: 'Quota exceeded' } }, '15'))
    expect(screen.getByRole('alert')).toHaveTextContent('Rate limit reached')
    expect(screen.getByRole('button', { name: 'Retry in 15 s' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Add an API key' })).toHaveAttribute(
      'href',
      '/settings',
    )
  })

  it('bad key: points to settings and offers no pointless retry', () => {
    renderError(mapHttpError(403, { error: { message: 'Forbidden' } }))
    expect(screen.getByText('Your API key was rejected')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Check your key' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  it('site error: shows the site-specific reason', async () => {
    const { onEdit, onRetry } = renderError(siteErrorFor('NO_FCP'))
    expect(screen.getByText(/never painted anything/)).toBeVisible()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Edit the address' }))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onEdit).toHaveBeenCalled()
    expect(onRetry).toHaveBeenCalled()
  })

  it.each([
    [timeoutError(), 'The test took too long'],
    [networkError(false), 'You’re offline'],
    [networkError(true), 'Couldn’t reach Google'],
    [mapHttpError(503, null), 'Google’s test servers had a problem'],
    [mapHttpError(400, { error: { message: 'Invalid' } }), 'Google couldn’t test that address'],
  ])('%#: renders a friendly title', (error, title) => {
    renderError(error)
    expect(screen.getByRole('heading', { name: title })).toBeVisible()
  })

  it('cancelled runs are a status, not an alert', () => {
    renderError(abortedError())
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('button', { name: 'Run it again' })).toBeEnabled()
  })

  it('never shows raw JSON, and redacts keys in technical detail', () => {
    renderError(
      mapHttpError(400, {
        error: { message: `Bad url=x&key=${FAKE_KEY}` },
      }),
    )
    expect(document.body.textContent).not.toContain('AIzaSy')
    expect(document.body.textContent).not.toContain('{"error"')
  })
})
