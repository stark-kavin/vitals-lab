export type NormalizeResult = { ok: true; url: string } | { ok: false; error: string }

export const NOT_PUBLIC_MESSAGE = 'PageSpeed Insights can only test publicly reachable sites.'

const SCHEME_RE = /^[a-z][a-z\d+.-]*:/i

/**
 * Turn user input like "example.com/shop" into "https://example.com/shop",
 * rejecting anything PSI cannot reach (other schemes, localhost, private IPs).
 */
export function normalizeUrl(input: string): NormalizeResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, error: 'Enter a web address, like example.com.' }
  if (/\s/.test(trimmed)) return { ok: false, error: 'Web addresses can’t contain spaces.' }

  // "example.com:8080" looks like a scheme to the URL parser, so only treat
  // it as one when it's followed by "//" or is a known non-web scheme.
  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) || isOpaqueScheme(trimmed)
  const candidate = hasScheme ? trimmed : `https://${trimmed.replace(/^\/+/, '')}`

  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return {
      ok: false,
      error: 'That doesn’t look like a web address. Try something like example.com.',
    }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: `${NOT_PUBLIC_MESSAGE} Use an http:// or https:// address.` }
  }
  if (url.username || url.password) {
    return { ok: false, error: 'Remove the username or password from the address.' }
  }

  const host = url.hostname.toLowerCase()
  if (!host) return { ok: false, error: 'That address is missing a domain name.' }
  if (isPrivateHost(host)) return { ok: false, error: NOT_PUBLIC_MESSAGE }
  if (!host.includes('.') && !host.startsWith('[')) {
    return { ok: false, error: 'Include the full domain, like example.com.' }
  }

  url.hash = ''
  return { ok: true, url: url.toString() }
}

function isOpaqueScheme(value: string): boolean {
  const match = SCHEME_RE.exec(value)
  if (!match) return false
  const scheme = match[0].slice(0, -1).toLowerCase()
  return [
    'ftp',
    'file',
    'data',
    'javascript',
    'mailto',
    'chrome',
    'about',
    'blob',
    'ws',
    'wss',
  ].includes(scheme)
}

export function isPrivateHost(hostname: string): boolean {
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')

  if (host === 'localhost' || host.endsWith('.localhost')) return true
  if (/\.(local|internal|lan|home|intranet|corp|test|invalid)$/.test(host)) return true

  const v4 = parseIPv4(host)
  if (v4) {
    const [a, b] = v4
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224 // multicast and reserved
    )
  }

  if (host.includes(':')) {
    if (host === '::' || host === '::1') return true
    if (/^f[cd][0-9a-f]{0,2}:/.test(host)) return true // unique local fc00::/7
    if (/^fe[89ab][0-9a-f]?:/.test(host)) return true // link-local fe80::/10
    const mapped = /^::ffff:(.+)$/.exec(host)
    if (mapped?.[1]) {
      const inner = mapped[1]
      if (parseIPv4(inner)) return isPrivateHost(inner)
      // URL serializes ::ffff:a.b.c.d as ::ffff:XXXX:XXXX
      const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(inner)
      if (hex?.[1] && hex[2]) {
        const hi = parseInt(hex[1], 16)
        const lo = parseInt(hex[2], 16)
        return isPrivateHost(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`)
      }
    }
  }
  return false
}

function parseIPv4(host: string): [number, number, number, number] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (!m) return null
  const parts = m.slice(1).map(Number)
  if (parts.some((p) => p > 255)) return null
  return parts as [number, number, number, number]
}
