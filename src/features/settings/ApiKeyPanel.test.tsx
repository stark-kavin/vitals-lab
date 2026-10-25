import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { KEYS } from '@/lib/storage'
import { renderWithApp } from '@/test/render'
import { ApiKeyPanel } from './ApiKeyPanel'

// Built at runtime so the source never contains a key-shaped literal.
const KEY = ['AIza', 'Sy', 'TEST'.repeat(8), '12'].join('')

describe('ApiKeyPanel', () => {
  it('saves a key masked by default, then removes it after confirmation', async () => {
    const user = userEvent.setup()
    renderWithApp(<ApiKeyPanel />)

    const input = screen.getByLabelText('Paste your key')
    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show key' }))
    expect(input).toHaveAttribute('type', 'text')

    await user.type(input, KEY)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(localStorage.getItem(KEYS.apiKey)).toBe(KEY)
    expect(screen.getByText('Key saved')).toBeVisible()
    // Only the last four characters are ever shown.
    expect(document.body.textContent).not.toContain(KEY)
    expect(screen.getByText(/•••• ST12/)).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Remove key' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Remove key' }))
    expect(localStorage.getItem(KEYS.apiKey)).toBeNull()
    expect(screen.getByText(/No key saved/)).toBeVisible()
  })

  it('reports an invalid key from the test button', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 400, message: 'API key not valid.' } }), {
        status: 400,
      }),
    )
    renderWithApp(<ApiKeyPanel />)
    await user.type(screen.getByLabelText('Paste your key'), 'bad-key')
    await user.click(screen.getByRole('button', { name: 'Test this key' }))
    expect(await screen.findByText(/Invalid key/)).toBeVisible()
    const url = String(vi.mocked(fetch).mock.calls[0]?.[0])
    expect(url).toContain('key=bad-key')
    expect(url.startsWith('https://www.googleapis.com/')).toBe(true)
  })

  it('reports quota exhaustion from the test button', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 429, message: 'Quota' } }), { status: 429 }),
    )
    renderWithApp(<ApiKeyPanel />)
    await user.type(screen.getByLabelText('Paste your key'), 'k')
    await user.click(screen.getByRole('button', { name: 'Test this key' }))
    expect(await screen.findByText(/quota is used up/)).toBeVisible()
  })
})
