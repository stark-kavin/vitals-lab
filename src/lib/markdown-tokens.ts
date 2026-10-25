export type MdToken =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; text: string; href: string }

// [text](url) or `code`. Link text may itself contain backticks; we strip them.
const TOKEN_RE = /\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`/g

export function safeHref(href: string): string | null {
  try {
    const u = new URL(href)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch {
    return null
  }
}

/** Split Lighthouse's Markdown-ish descriptions into a flat token list. */
export function tokenize(source: string): MdToken[] {
  const out: MdToken[] = []
  let last = 0
  for (const m of source.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0
    if (idx > last) out.push({ type: 'text', value: source.slice(last, idx) })
    if (m[1] !== undefined && m[2] !== undefined) {
      const href = safeHref(m[2])
      const text = m[1].replace(/`/g, '')
      out.push(href ? { type: 'link', text, href } : { type: 'text', value: text })
    } else if (m[3] !== undefined) {
      out.push({ type: 'code', value: m[3] })
    }
    last = idx + m[0].length
  }
  if (last < source.length) out.push({ type: 'text', value: source.slice(last) })
  return out
}
