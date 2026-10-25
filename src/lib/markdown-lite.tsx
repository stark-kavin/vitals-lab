import type { ReactNode } from 'react'
import { tokenize } from './markdown-tokens'

/** Renders `[text](url)` and inline `code` only. Everything else is plain text. */
export function MarkdownLite({ text, className }: { text: string; className?: string }): ReactNode {
  return (
    <span className={className}>
      {tokenize(text).map((t, i) => {
        if (t.type === 'code') return <code key={i}>{t.value}</code>
        if (t.type === 'link')
          return (
            <a key={i} href={t.href} target="_blank" rel="noopener noreferrer">
              {t.text}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )
        return <span key={i}>{t.value}</span>
      })}
    </span>
  )
}
