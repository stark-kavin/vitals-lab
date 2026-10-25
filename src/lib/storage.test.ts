import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addHistory,
  clearHistory,
  DEFAULT_SETTINGS,
  getApiKey,
  getHistory,
  getSettings,
  HISTORY_LIMIT,
  KEYS,
  removeApiKey,
  resetAll,
  runMigrations,
  setApiKey,
  setSettings,
  storageAvailable,
  type HistoryEntry,
} from './storage'

const entry = (i: number): HistoryEntry => ({
  id: `id-${i}`,
  url: 'https://example.com/',
  strategy: 'mobile',
  timestamp: i,
  scores: { performance: 50, accessibility: 90, 'best-practices': 100, seo: 80 },
  metrics: { FCP: 1, LCP: 2, TBT: 3, CLS: 0.1, SI: 4, INP: null },
})

afterEach(() => resetAll())

describe('storage', () => {
  it('uses versioned keys', () => {
    expect(KEYS.apiKey).toBe('vitalslab:v1:apiKey')
    expect(KEYS.history).toBe('vitalslab:v1:history')
  })

  it('saves, trims and removes the API key', () => {
    expect(getApiKey()).toBeNull()
    setApiKey('  abc123  ')
    expect(localStorage.getItem(KEYS.apiKey)).toBe('abc123')
    expect(getApiKey()).toBe('abc123')
    removeApiKey()
    expect(getApiKey()).toBeNull()
  })

  it('returns defaults for missing or corrupt settings', () => {
    expect(getSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem(KEYS.settings, '{not json')
    expect(getSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem(KEYS.settings, JSON.stringify({ strategy: 'tablet', theme: 'dark' }))
    expect(getSettings()).toMatchObject({ strategy: 'mobile', theme: 'dark' })
  })

  it('round-trips settings', () => {
    const s = { ...DEFAULT_SETTINGS, strategy: 'desktop' as const, categories: ['seo' as const] }
    setSettings(s)
    expect(getSettings()).toEqual(s)
  })

  it('caps history and drops invalid rows', () => {
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) addHistory(entry(i))
    const h = getHistory()
    expect(h).toHaveLength(HISTORY_LIMIT)
    expect(h[0]?.id).toBe(`id-${HISTORY_LIMIT + 4}`)

    localStorage.setItem(KEYS.history, JSON.stringify([entry(1), { junk: true }]))
    expect(getHistory()).toHaveLength(1)
    clearHistory()
    expect(getHistory()).toEqual([])
  })

  it('records the schema version on migration', () => {
    runMigrations()
    expect(localStorage.getItem(KEYS.schema)).toBe('1')
  })

  it('resetAll removes only our keys', () => {
    localStorage.setItem('other-app', 'keep')
    setApiKey('k')
    addHistory(entry(1))
    resetAll()
    expect(localStorage.getItem('other-app')).toBe('keep')
    expect(getApiKey()).toBeNull()
    expect(getHistory()).toEqual([])
  })
})

describe('storage when blocked', () => {
  it('falls back to memory instead of throwing', () => {
    const boom = () => {
      throw new DOMException('denied', 'SecurityError')
    }
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(boom)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(boom)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(boom)

    expect(storageAvailable()).toBe(false)
    expect(() => setApiKey('mem-key')).not.toThrow()
    expect(getApiKey()).toBe('mem-key')
    expect(() => addHistory(entry(1))).not.toThrow()
    expect(getHistory()).toHaveLength(1)
    expect(getSettings()).toEqual(DEFAULT_SETTINGS)
    expect(() => resetAll()).not.toThrow()
  })
})
