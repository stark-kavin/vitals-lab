import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as storage from '@/lib/storage'
import type { HistoryEntry, Settings, Theme } from '@/lib/storage'

interface SettingsContextValue {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  apiKey: string | null
  saveApiKey: (key: string) => boolean
  removeApiKey: () => void
  history: HistoryEntry[]
  addHistory: (entry: HistoryEntry) => void
  removeHistoryEntry: (id: string) => void
  clearHistory: () => void
  resetAll: () => void
  /** False when storage is blocked; changes then last only for this tab. */
  persistent: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(() => {
    storage.runMigrations()
    return storage.getSettings()
  })
  const [apiKey, setApiKey] = useState(() => storage.getApiKey())
  const [history, setHistory] = useState(() => storage.getHistory())
  const [persistent] = useState(() => storage.storageAvailable())

  useEffect(() => applyTheme(settings.theme), [settings.theme])

  // Keep tabs in sync when another tab changes our keys.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key?.startsWith(`${storage.STORAGE_PREFIX}:`)) return
      setSettings(storage.getSettings())
      setApiKey(storage.getApiKey())
      setHistory(storage.getHistory())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      storage.setSettings(next)
      return next
    })
  }, [])

  const saveApiKey = useCallback((key: string) => {
    const ok = storage.setApiKey(key)
    setApiKey(storage.getApiKey())
    return ok
  }, [])

  const removeApiKey = useCallback(() => {
    storage.removeApiKey()
    setApiKey(null)
  }, [])

  const addHistory = useCallback((entry: HistoryEntry) => setHistory(storage.addHistory(entry)), [])
  const removeHistoryEntry = useCallback(
    (id: string) => setHistory(storage.removeHistoryEntry(id)),
    [],
  )
  const clearHistory = useCallback(() => {
    storage.clearHistory()
    setHistory([])
  }, [])

  const resetAll = useCallback(() => {
    storage.resetAll()
    storage.runMigrations()
    setSettings(storage.DEFAULT_SETTINGS)
    setApiKey(null)
    setHistory([])
  }, [])

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      apiKey,
      saveApiKey,
      removeApiKey,
      history,
      addHistory,
      removeHistoryEntry,
      clearHistory,
      resetAll,
      persistent,
    }),
    [
      settings,
      updateSettings,
      apiKey,
      saveApiKey,
      removeApiKey,
      history,
      addHistory,
      removeHistoryEntry,
      clearHistory,
      resetAll,
      persistent,
    ],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
