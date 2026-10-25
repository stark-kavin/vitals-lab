import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownLite } from './markdown-lite'
import { tokenize } from './markdown-tokens'

describe('markdown-lite', () => {
  it('tokenizes links and code', () => {
    expect(tokenize('Use `font-display` and [learn more](https://web.dev/x).')).toEqual([
      { type: 'text', value: 'Use ' },
      { type: 'code', value: 'font-display' },
      { type: 'text', value: ' and ' },
      { type: 'link', text: 'learn more', href: 'https://web.dev/x' },
      { type: 'text', value: '.' },
    ])
  })

  it('drops unsafe link schemes to plain text', () => {
    expect(tokenize('[click](javascript:alert(1))')[0]).toEqual({ type: 'text', value: 'click' })
  })

  it('renders HTML in descriptions as text, never markup', () => {
    const { container } = render(
      <MarkdownLite text={'<img src=x onerror=alert(1)> [doc](https://a.com)'} />,
    )
    expect(container.querySelector('img')).toBeNull()
    const link = screen.getByRole('link', { name: /doc/ })
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
