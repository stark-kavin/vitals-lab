import { CATEGORY_IDS, STRATEGIES, type CategoryId, type Strategy } from './psi-types'

/**
 * The only module that touches Web Storage. Every access is wrapped in
 * try/catch: private mode, blocked cookies or a full quota fall back to an
 * in-memory store so the app keeps working for the session.
 */

export const STORAGE_PREFIX = 'vitalslab'
export const SCHEMA_VERSION = 1
const ns = (name: string) => `${STORAGE_PREFIX}:v${SCHEMA_VERSION}:${name}`

export const KEYS = {
  schema: `${STORAGE_PREFIX}:schema`,
  apiKey: ns('apiKey'),
  settings: ns('settings'),
  history: ns('history'),
  lastRun: ns('lastRun'),
} as const

type Area = 'local' | 'session'
const memory: Record<Area, Map<string, string>> = { local: new Map(), session: new Map() }

function area(kind: Area): Storage | null {
  try {
    const s = kind === 'local' ? window.localStorage : window.sessionStorage
    // Touch it: some browsers expose the object but throw on use.
    const probe = `${STORAGE_PREFIX}:probe`
    s.setItem(probe, '1')
    s.removeItem(probe)
    return s
  } catch {
    return null
  }
}

export function storageAvailable(kind: Area = 'local'): boolean {
  return area(kind) !== null
}

function read(kind: Area, key: string): string | null {
  try {
    const v = area(kind)?.getItem(key)
    if (v != null) return v
  } catch {
    /* fall through to memory */
  }
  return memory[kind].get(key) ?? null
}

/** Returns false if the value only made it into memory (storage blocked or full). */
function write(kind: Area, key: string, value: string): boolean {
  memory[kind].set(key, value)
  try {
    const s = area(kind)
    if (!s) return false
    s.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function remove(kind: Area, key: string): void {
  memory[kind].delete(key)
  try {
    area(kind)?.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Parse stored JSON and validate it; returns null when missing, corrupt or invalid. */
function readJson<T>(kind: Area, key: string, validate: (v: unknown) => T | null): T | null {
  const raw = read(kind, key)
  if (raw == null) return null
  try {
    return validate(JSON.parse(raw))
  } catch {
    return null
  }
}

// Tiny validators: storage is read on every page load, so we avoid shipping
// a schema library on the critical path for these few shapes.
type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const oneOf = <T extends string>(options: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (options as readonly string[]).includes(v)
const numOrNull = (v: unknown): v is number | null =>
  v === null || (typeof v === 'number' && Number.isFinite(v))

// ---------------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------------

/**
 * Migration hook. Each entry upgrades stored data from version N-1 to N.
 * Add `2: () => { ... }` here when the schema changes, then bump SCHEMA_VERSION.
 */
const MIGRATIONS: Record<number, () => void> = {}

export function runMigrations(): void {
  const current = Number(read('local', KEYS.schema) ?? '0') || 0
  if (current >= SCHEMA_VERSION) return
  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    try {
      MIGRATIONS[v]?.()
    } catch (err) {
      console.warn(`Storage migration to v${v} failed`, err instanceof Error ? err.name : '')
    }
  }
  write('local', KEYS.schema, String(SCHEMA_VERSION))
}

// ---------------------------------------------------------------------------
// API key
// ---------------------------------------------------------------------------

export function getApiKey(): string | null {
  const k = read('local', KEYS.apiKey)
  return k && k.trim() ? k.trim() : null
}

export function setApiKey(key: string): boolean {
  return write('local', KEYS.apiKey, key.trim())
}

export function removeApiKey(): void {
  remove('local', KEYS.apiKey)
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export interface Settings {
  strategy: Strategy
  categories: CategoryId[]
  locale: string
  theme: Theme
}

/** Repairs field by field, so one bad value doesn't discard the rest. */
export function parseSettings(v: unknown): Settings | null {
  if (!isObj(v)) return null
  const cats = Array.isArray(v.categories)
    ? CATEGORY_IDS.filter((c) => (v.categories as unknown[]).includes(c))
    : []
  return {
    strategy: oneOf(STRATEGIES, v.strategy) ? v.strategy : DEFAULT_SETTINGS.strategy,
    categories: cats.length ? cats : [...CATEGORY_IDS],
    locale:
      typeof v.locale === 'string' && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(v.locale)
        ? v.locale
        : DEFAULT_SETTINGS.locale,
    theme: oneOf(THEMES, v.theme) ? v.theme : DEFAULT_SETTINGS.theme,
  }
}

export const DEFAULT_SETTINGS: Settings = {
  strategy: 'mobile',
  categories: [...CATEGORY_IDS],
  locale: 'en',
  theme: 'system',
}

export function getSettings(): Settings {
  return readJson('local', KEYS.settings, parseSettings) ?? DEFAULT_SETTINGS
}

export function setSettings(next: Settings): boolean {
  return write('local', KEYS.settings, JSON.stringify(next))
}

// ---------------------------------------------------------------------------
// History (compact summaries only; never full responses or screenshots)
// ---------------------------------------------------------------------------

export const HISTORY_LIMIT = 30

export interface HistoryEntry {
  id: string
  url: string
  strategy: Strategy
  timestamp: number
  scores: Record<CategoryId, number | null>
  metrics: {
    FCP: number | null
    LCP: number | null
    TBT: number | null
    CLS: number | null
    SI: number | null
    /** Field (CrUX) p75 INP when available. */
    INP: number | null
  }
}

const METRIC_KEYS = ['FCP', 'LCP', 'TBT', 'CLS', 'SI', 'INP'] as const

export function isHistoryEntry(v: unknown): v is HistoryEntry {
  if (!isObj(v) || !isObj(v.scores) || !isObj(v.metrics)) return false
  const { scores, metrics } = v
  return (
    typeof v.id === 'string' &&
    typeof v.url === 'string' &&
    oneOf(STRATEGIES, v.strategy) &&
    typeof v.timestamp === 'number' &&
    CATEGORY_IDS.every((c) => numOrNull(scores[c])) &&
    METRIC_KEYS.every((m) => numOrNull(metrics[m]))
  )
}

const parseHistory = (v: unknown): HistoryEntry[] | null =>
  Array.isArray(v) ? v.filter(isHistoryEntry) : null

export function getHistory(): HistoryEntry[] {
  return readJson('local', KEYS.history, parseHistory) ?? []
}

export function addHistory(entry: HistoryEntry): HistoryEntry[] {
  const next = [entry, ...getHistory().filter((e) => e.id !== entry.id)].slice(0, HISTORY_LIMIT)
  write('local', KEYS.history, JSON.stringify(next))
  return next
}

export function removeHistoryEntry(id: string): HistoryEntry[] {
  const next = getHistory().filter((e) => e.id !== id)
  write('local', KEYS.history, JSON.stringify(next))
  return next
}

export function clearHistory(): void {
  remove('local', KEYS.history)
}

// ---------------------------------------------------------------------------
// Last full run (session only, best effort: responses can be 1-2 MB)
// ---------------------------------------------------------------------------

export interface LastRun {
  savedAt: number
  isSample: boolean
  /** The address the user asked for (may differ slightly from Lighthouse's). */
  url?: string
  results: { strategy: Strategy; raw: unknown }[]
}

function parseLastRun(v: unknown): LastRun | null {
  if (!isObj(v) || typeof v.savedAt !== 'number' || !Array.isArray(v.results)) return null
  const results = v.results.filter(
    (r): r is LastRun['results'][number] => isObj(r) && oneOf(STRATEGIES, r.strategy) && 'raw' in r,
  )
  return {
    savedAt: v.savedAt,
    isSample: v.isSample === true,
    url: typeof v.url === 'string' ? v.url : undefined,
    results,
  }
}

export function getLastRun(): LastRun | null {
  return readJson('session', KEYS.lastRun, parseLastRun)
}

export function setLastRun(run: LastRun): boolean {
  try {
    return write('session', KEYS.lastRun, JSON.stringify(run))
  } catch {
    return false
  }
}

export function clearLastRun(): void {
  remove('session', KEYS.lastRun)
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

/** Remove every key this app owns, in both storage areas and memory. */
export function resetAll(): void {
  for (const kind of ['local', 'session'] as const) {
    memory[kind].clear()
    try {
      const s = area(kind)
      if (!s) continue
      const owned: string[] = []
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i)
        if (k?.startsWith(`${STORAGE_PREFIX}:`)) owned.push(k)
      }
      owned.forEach((k) => s.removeItem(k))
    } catch {
      /* ignore */
    }
  }
}

export type { CategoryId, Strategy }
