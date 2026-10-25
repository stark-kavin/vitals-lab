import {
  auditSchema,
  categorySchema,
  psiErrorBodySchema,
  psiResponseSchema,
  type Audit,
  type Category,
} from './psi-schemas'
import { CATEGORY_IDS, type CategoryId, type Report, type Strategy } from './psi-types'

export const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
export const PSI_TIMEOUT_MS = 90_000

export interface PsiRequest {
  url: string
  strategy: Strategy
  categories: readonly CategoryId[]
  locale?: string
  /** Only sent when the user saved one. Never logged or echoed. */
  apiKey?: string | null
}

export function buildPsiUrl(req: PsiRequest): string {
  const params = new URLSearchParams()
  params.set('url', req.url)
  params.set('strategy', req.strategy)
  const cats = req.categories.length ? req.categories : CATEGORY_IDS
  for (const c of cats) params.append('category', c)
  if (req.locale) params.set('locale', req.locale)
  if (req.apiKey) params.set('key', req.apiKey)
  return `${PSI_ENDPOINT}?${params.toString()}`
}

// ---------------------------------------------------------------------------
// Key redaction
// ---------------------------------------------------------------------------

const KEY_PARAM_RE = /([?&]key=)[^&#\s"'<>]*/gi
// Google API keys: "AIza" + 35 URL-safe characters.
const GOOGLE_KEY_RE = /AIza[0-9A-Za-z_-]{35}/g

/** Remove any API key from text before it's shown, logged or exported. */
export function redactKey(text: string, knownKey?: string | null): string {
  let out = text.replace(KEY_PARAM_RE, '$1REDACTED').replace(GOOGLE_KEY_RE, 'REDACTED')
  if (knownKey && knownKey.length >= 8) out = out.split(knownKey).join('REDACTED')
  return out
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type PsiErrorKind =
  | 'invalid-url'
  | 'bad-key'
  | 'quota'
  | 'server'
  | 'timeout'
  | 'offline'
  | 'network'
  | 'aborted'
  | 'site'
  | 'parse'

export interface PsiErrorInit {
  kind: PsiErrorKind
  title: string
  message: string
  status?: number
  retryable?: boolean
  /** Suggested wait before retrying, in seconds. */
  retryAfter?: number
  /** Short technical detail (already redacted). */
  detail?: string
  /** Lighthouse runtime error code such as NO_FCP. */
  code?: string
}

export class PsiError extends Error {
  readonly kind: PsiErrorKind
  readonly title: string
  readonly status?: number
  readonly retryable: boolean
  readonly retryAfter?: number
  readonly detail?: string
  readonly code?: string

  constructor(init: PsiErrorInit) {
    super(init.message)
    this.name = 'PsiError'
    this.kind = init.kind
    this.title = init.title
    this.status = init.status
    this.retryable = init.retryable ?? false
    this.retryAfter = init.retryAfter
    this.detail = init.detail
    this.code = init.code
  }
}

const SITE_ERRORS: Record<string, string> = {
  FAILED_DOCUMENT_REQUEST:
    'The page didn’t respond. Check that it loads in a normal browser and isn’t behind a login or firewall.',
  ERRORED_DOCUMENT_REQUEST:
    'The server answered with an error status (like 404 or 500), so there was no page to measure.',
  NO_FCP:
    'The page never painted anything on screen. It may be blank, very slow, or blocking automated testing.',
  NO_LCP: 'No main content was painted, so loading speed couldn’t be measured.',
  DNS_FAILURE: 'The domain name couldn’t be found. Check the spelling of the address.',
  INVALID_URL: 'Google couldn’t read that address. Check the spelling.',
  PAGE_HUNG: 'The page stopped responding while it was being tested.',
  NOT_HTML: 'That address returns a file, not a web page.',
  NO_DOCUMENT_REQUEST: 'The page didn’t load any content to measure.',
  INSECURE_DOCUMENT_REQUEST:
    'The page’s security certificate is invalid, so Google refused to load it.',
  CHROME_INTERSTITIAL_ERROR:
    'Chrome showed a warning screen instead of the page (often a certificate or safety warning).',
  PROTOCOL_TIMEOUT: 'The test took too long to complete. The page may be very heavy.',
  NO_NAVSTART: 'The page navigation never started. Try again in a moment.',
  TARGET_CRASHED: 'The browser tab crashed while loading the page.',
}

export function siteErrorFor(code: string, fallback?: string): PsiError {
  return new PsiError({
    kind: 'site',
    code,
    title: 'This page couldn’t be tested',
    message:
      SITE_ERRORS[code] ??
      'The page blocked or failed the automated test. Some sites refuse requests from Google’s test servers.',
    detail: fallback ? redactKey(`${code}: ${fallback}`) : code,
    retryable: true,
  })
}

function findSiteCode(message: string): string | null {
  const known = Object.keys(SITE_ERRORS).find((code) => message.includes(code))
  if (known) return known
  const m = /Lighthouse returned error: ([A-Z_]+)/.exec(message)
  return m?.[1] ?? null
}

/** Map an HTTP failure from PSI to a friendly, actionable error. */
export function mapHttpError(
  status: number,
  body: unknown,
  retryAfterHeader?: string | null,
): PsiError {
  const parsed = psiErrorBodySchema.safeParse(body)
  const apiMessage = parsed.success ? (parsed.data.error.message ?? '') : ''
  const reason = parsed.success ? (parsed.data.error.errors?.[0]?.reason ?? '') : ''
  const detail = apiMessage ? redactKey(apiMessage).slice(0, 400) : undefined

  const siteCode = findSiteCode(apiMessage)
  if (siteCode && status !== 429 && status !== 403) return siteErrorFor(siteCode, apiMessage)

  if (status === 400) {
    if (/key/i.test(apiMessage) && /(invalid|not valid|expired)/i.test(apiMessage)) {
      return badKeyError(status, detail)
    }
    return new PsiError({
      kind: 'invalid-url',
      status,
      title: 'Google couldn’t test that address',
      message:
        'The URL is invalid or the site couldn’t be reached from Google’s servers. Check the address and that the site is public.',
      detail,
    })
  }
  if (status === 401 || status === 403) return badKeyError(status, detail)
  if (status === 429 || reason === 'rateLimitExceeded' || reason === 'dailyLimitExceeded') {
    const retryAfter = Number(retryAfterHeader)
    return new PsiError({
      kind: 'quota',
      status,
      title: 'Rate limit reached',
      message:
        'Google limits how often the API can be called. Without your own key, everyone shares one small quota. Add a free API key in Settings, or wait a bit and retry.',
      retryable: true,
      retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 30,
      detail,
    })
  }
  if (status >= 500) {
    return new PsiError({
      kind: 'server',
      status,
      title: 'Google’s test servers had a problem',
      message: 'This is usually temporary. Try again in a minute.',
      retryable: true,
      detail,
    })
  }
  return new PsiError({
    kind: 'server',
    status,
    title: `Unexpected response (${status})`,
    message: 'Google returned an error we didn’t expect. Try again.',
    retryable: true,
    detail,
  })
}

function badKeyError(status: number, detail?: string): PsiError {
  return new PsiError({
    kind: 'bad-key',
    status,
    title: 'Your API key was rejected',
    message:
      'The key is invalid, restricted to another site, or the PageSpeed Insights API isn’t enabled for it. Check it in Settings.',
    detail,
  })
}

export function timeoutError(): PsiError {
  return new PsiError({
    kind: 'timeout',
    title: 'The test took too long',
    message: `No answer after ${PSI_TIMEOUT_MS / 1000} seconds. Heavy pages sometimes time out; try again.`,
    retryable: true,
  })
}

export function abortedError(): PsiError {
  return new PsiError({ kind: 'aborted', title: 'Cancelled', message: 'You cancelled the test.' })
}

export function networkError(online: boolean): PsiError {
  return online
    ? new PsiError({
        kind: 'network',
        title: 'Couldn’t reach Google',
        message:
          'The request didn’t get through. A browser extension, firewall or network filter may be blocking googleapis.com.',
        retryable: true,
      })
    : new PsiError({
        kind: 'offline',
        title: 'You’re offline',
        message: 'Reconnect to the internet and try again. The sample report still works offline.',
        retryable: true,
      })
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export function parsePsiResponse(json: unknown, strategy: Strategy): Report {
  const res = psiResponseSchema.safeParse(json)
  if (!res.success) {
    throw new PsiError({
      kind: 'parse',
      title: 'Unexpected report format',
      message: 'Google answered, but the report wasn’t in a format we understand. Try again.',
      retryable: true,
    })
  }
  const data = res.data
  const lhr = data.lighthouseResult

  const audits: Record<string, Audit> = {}
  for (const [id, raw] of Object.entries(lhr.audits)) {
    const a = auditSchema.safeParse(raw)
    if (a.success) audits[id] = a.data
  }

  const categories: Category[] = []
  for (const id of CATEGORY_IDS) {
    const c = categorySchema.safeParse(lhr.categories[id])
    if (c.success) categories.push(c.data)
  }

  const le = data.loadingExperience
  return {
    requestedUrl: lhr.requestedUrl ?? data.id ?? '',
    finalUrl: lhr.finalDisplayedUrl ?? lhr.finalUrl ?? lhr.requestedUrl ?? data.id ?? '',
    strategy,
    fetchTime: lhr.fetchTime ?? data.analysisUTCTimestamp ?? null,
    lighthouseVersion: lhr.lighthouseVersion ?? null,
    categories,
    categoryGroups: lhr.categoryGroups ?? {},
    audits,
    // With origin_fallback the "URL" data is really the origin's; don't show it twice.
    loadingExperience: le && !le.origin_fallback ? le : null,
    originLoadingExperience: data.originLoadingExperience ?? null,
    runtimeError: lhr.runtimeError ?? null,
    raw: json,
  }
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export interface RunOptions {
  signal?: AbortSignal
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export async function runPagespeed(req: PsiRequest, opts: RunOptions = {}): Promise<Report> {
  const { signal, timeoutMs = PSI_TIMEOUT_MS, fetchImpl = fetch } = opts
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onAbort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    let response: Response
    try {
      response = await fetchImpl(buildPsiUrl(req), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        referrerPolicy: 'strict-origin-when-cross-origin',
      })
    } catch {
      if (timedOut) throw timeoutError()
      if (signal?.aborted) throw abortedError()
      throw networkError(typeof navigator === 'undefined' ? true : navigator.onLine)
    }

    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      if (timedOut) throw timeoutError()
      if (signal?.aborted) throw abortedError()
      if (response.ok) {
        throw new PsiError({
          kind: 'parse',
          title: 'Unreadable response',
          message: 'Google’s answer was cut off or malformed. Try again.',
          retryable: true,
        })
      }
    }

    if (!response.ok) throw mapHttpError(response.status, body, response.headers.get('Retry-After'))

    const report = parsePsiResponse(body, req.strategy)
    if (report.runtimeError)
      throw siteErrorFor(report.runtimeError.code, report.runtimeError.message)
    return report
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/** Normalise anything thrown into a PsiError with key-free text. */
export function toPsiError(err: unknown): PsiError {
  if (err instanceof PsiError) return err
  const message = err instanceof Error ? err.message : String(err)
  return new PsiError({
    kind: 'network',
    title: 'Something went wrong',
    message: 'The test failed unexpectedly. Try again.',
    detail: redactKey(message).slice(0, 300),
    retryable: true,
  })
}
