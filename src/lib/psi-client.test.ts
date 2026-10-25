import { describe, expect, it, vi } from 'vitest'
import sample from '@/fixtures/sample-report.json'
import {
  buildPsiUrl,
  mapHttpError,
  parsePsiResponse,
  PsiError,
  redactKey,
  runPagespeed,
  toPsiError,
} from './psi-client'

// Built at runtime so the source never contains a key-shaped literal.
const KEY = ['AIza', 'SyD-', '1234567890', 'abcdefghijklmnopqrstu'].join('')

describe('buildPsiUrl', () => {
  it('repeats the category param and encodes the url', () => {
    const u = new URL(
      buildPsiUrl({
        url: 'https://example.com/a?b=1&c=2',
        strategy: 'desktop',
        categories: ['performance', 'seo'],
        locale: 'de',
      }),
    )
    expect(u.origin + u.pathname).toBe('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
    expect(u.searchParams.get('url')).toBe('https://example.com/a?b=1&c=2')
    expect(u.searchParams.getAll('category')).toEqual(['performance', 'seo'])
    expect(u.searchParams.get('strategy')).toBe('desktop')
    expect(u.searchParams.get('locale')).toBe('de')
    expect(u.searchParams.has('key')).toBe(false)
  })

  it('falls back to all categories and only adds key when given', () => {
    const u = new URL(
      buildPsiUrl({ url: 'https://a.com/', strategy: 'mobile', categories: [], apiKey: KEY }),
    )
    expect(u.searchParams.getAll('category')).toHaveLength(4)
    expect(u.searchParams.get('key')).toBe(KEY)
  })
})

describe('redactKey', () => {
  it('removes key query params', () => {
    expect(redactKey('GET https://x.com/?url=a&key=secret123&strategy=m')).toBe(
      'GET https://x.com/?url=a&key=REDACTED&strategy=m',
    )
  })
  it('removes bare Google keys and a known key', () => {
    expect(redactKey(`bad key ${KEY} here`)).toBe('bad key REDACTED here')
    expect(redactKey('token=my-custom-key-value', 'my-custom-key-value')).toBe('token=REDACTED')
  })
})

describe('mapHttpError', () => {
  const body = (message: string, reason?: string) => ({
    error: { code: 0, message, errors: reason ? [{ reason }] : [] },
  })

  it('maps 400 to invalid-url', () => {
    expect(mapHttpError(400, body('Invalid value')).kind).toBe('invalid-url')
  })
  it('maps 400 with a bad key message to bad-key', () => {
    expect(mapHttpError(400, body('API key not valid. Please pass a valid API key.')).kind).toBe(
      'bad-key',
    )
  })
  it('maps 403 to bad-key', () => {
    expect(mapHttpError(403, body('Requests from referer are blocked.')).kind).toBe('bad-key')
  })
  it('maps 429 to retryable quota with a delay', () => {
    const e = mapHttpError(429, body('Quota exceeded', 'rateLimitExceeded'), '12')
    expect(e).toMatchObject({ kind: 'quota', retryable: true, retryAfter: 12 })
  })
  it('maps 5xx to server', () => {
    expect(mapHttpError(503, null)).toMatchObject({ kind: 'server', retryable: true })
  })
  it('recognises Lighthouse runtime errors inside error messages', () => {
    const e = mapHttpError(
      500,
      body('Lighthouse returned error: NO_FCP. The page did not paint any content.'),
    )
    expect(e).toMatchObject({ kind: 'site', code: 'NO_FCP' })
    expect(e.message).toMatch(/never painted/)
  })
  it('redacts keys in error detail', () => {
    const e = mapHttpError(400, body(`Bad request for ...&key=${KEY}`))
    expect(e.detail).not.toContain(KEY)
    expect(e.detail).toContain('key=REDACTED')
  })
})

describe('parsePsiResponse', () => {
  it('normalises the sample fixture', () => {
    const r = parsePsiResponse(sample, 'mobile')
    expect(r.finalUrl).toBe('https://northwind-pantry.example/')
    expect(r.categories.map((c) => c.id)).toEqual([
      'performance',
      'accessibility',
      'best-practices',
      'seo',
    ])
    expect(r.audits['largest-contentful-paint']?.numericValue).toBeGreaterThan(0)
    expect(r.loadingExperience?.metrics).toBeDefined()
    expect(r.runtimeError).toBeNull()
  })

  it('drops URL field data when it is an origin fallback', () => {
    const r = parsePsiResponse(
      { loadingExperience: { origin_fallback: true, metrics: {} }, lighthouseResult: {} },
      'desktop',
    )
    expect(r.loadingExperience).toBeNull()
  })

  it('skips malformed audits instead of failing', () => {
    const r = parsePsiResponse(
      { lighthouseResult: { audits: { ok: { id: 'ok', title: 'OK' }, bad: { id: 3 } } } },
      'mobile',
    )
    expect(Object.keys(r.audits)).toEqual(['ok'])
  })

  it('throws a parse error without a lighthouseResult', () => {
    expect(() => parsePsiResponse({ nope: true }, 'mobile')).toThrow(PsiError)
  })
})

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('runPagespeed', () => {
  const req = {
    url: 'https://example.com/',
    strategy: 'mobile' as const,
    categories: [],
    apiKey: KEY,
  }

  it('returns a parsed report', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, sample))
    const r = await runPagespeed(req, { fetchImpl })
    expect(r.strategy).toBe('mobile')
    expect(fetchImpl).toHaveBeenCalledOnce()
  })

  it('maps HTTP errors', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(429, { error: { message: 'Quota' } }))
    await expect(runPagespeed(req, { fetchImpl })).rejects.toMatchObject({ kind: 'quota' })
  })

  it('reports lighthouse runtime errors from a 200', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, {
        lighthouseResult: { runtimeError: { code: 'FAILED_DOCUMENT_REQUEST', message: 'x' } },
      }),
    )
    await expect(runPagespeed(req, { fetchImpl })).rejects.toMatchObject({
      kind: 'site',
      code: 'FAILED_DOCUMENT_REQUEST',
    })
  })

  const hanging = (_: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener('abort', () =>
        reject(new DOMException('Aborted', 'AbortError')),
      )
    })

  it('times out', async () => {
    await expect(runPagespeed(req, { fetchImpl: hanging, timeoutMs: 10 })).rejects.toMatchObject({
      kind: 'timeout',
    })
  })

  it('can be cancelled', async () => {
    const controller = new AbortController()
    const p = runPagespeed(req, { fetchImpl: hanging, signal: controller.signal })
    controller.abort()
    await expect(p).rejects.toMatchObject({ kind: 'aborted' })
  })

  it('reports offline vs network failures', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError(`Failed to fetch https://x/?key=${KEY}`)
    })
    const spy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    await expect(runPagespeed(req, { fetchImpl })).rejects.toMatchObject({ kind: 'offline' })
    spy.mockReturnValue(true)
    await expect(runPagespeed(req, { fetchImpl })).rejects.toMatchObject({ kind: 'network' })
  })

  it('never leaks the key through toPsiError', () => {
    const e = toPsiError(new Error(`boom https://x/?key=${KEY}`))
    expect(JSON.stringify({ ...e, message: e.message })).not.toContain(KEY)
  })
})
