import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSettings } from '@/app/settings-context'
import { toHistoryEntry } from '@/lib/history'
import type { PsiError } from '@/lib/psi-client'
import type { Report, Strategy } from '@/lib/psi-types'
import { getApiKey, getLastRun, setLastRun } from '@/lib/storage'
import { SAMPLE_URL, type RunRequest } from './run'

export type AnalysisState =
  | { status: 'idle' }
  | { status: 'running'; request: RunRequest; startedAt: number }
  | {
      status: 'done'
      request: RunRequest
      reports: Partial<Record<Strategy, Report>>
      /** Per-strategy failures when "both" partly failed. */
      errors: Partial<Record<Strategy, PsiError>>
      isSample: boolean
    }
  | { status: 'error'; request: RunRequest; error: PsiError }

type Action =
  | { type: 'start'; request: RunRequest; startedAt: number }
  | {
      type: 'done'
      request: RunRequest
      reports: Partial<Record<Strategy, Report>>
      errors: Partial<Record<Strategy, PsiError>>
      isSample: boolean
    }
  | { type: 'error'; request: RunRequest; error: PsiError }
  | { type: 'reset' }

function reducer(_: AnalysisState, action: Action): AnalysisState {
  switch (action.type) {
    case 'start':
      return { status: 'running', request: action.request, startedAt: action.startedAt }
    case 'done':
      return {
        status: 'done',
        request: action.request,
        reports: action.reports,
        errors: action.errors,
        isSample: action.isSample,
      }
    case 'error':
      return { status: 'error', request: action.request, error: action.error }
    case 'reset':
      return { status: 'idle' }
  }
}

// The client (and zod) load on demand so they stay out of the first-load bundle.
const loadClient = () => import('@/lib/psi-client')

/** Rebuild the last full result from sessionStorage, so a refresh keeps the report. */
async function restore(): Promise<AnalysisState | null> {
  const last = getLastRun()
  if (!last || last.results.length === 0) return null
  try {
    const { parsePsiResponse } = await loadClient()
    const reports: Partial<Record<Strategy, Report>> = {}
    for (const r of last.results) reports[r.strategy] = parsePsiResponse(r.raw, r.strategy)
    const first = Object.values(reports)[0]
    if (!first) return null
    return {
      status: 'done',
      request: {
        url: last.isSample ? SAMPLE_URL : (last.url ?? first.requestedUrl),
        strategies: last.results.map((r) => r.strategy),
        categories: [],
        locale: 'en',
      },
      reports,
      errors: {},
      isSample: last.isSample,
    }
  } catch {
    return null
  }
}

interface AnalysisContextValue {
  state: AnalysisState
  /** False until the previous session's report has been restored (or found absent). */
  restored: boolean
  start: (request: RunRequest) => void
  cancel: () => void
  loadSample: () => Promise<void>
  reset: () => void
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' })
  const [restored, setRestored] = useState(() => getLastRun() === null)
  const controllerRef = useRef<AbortController | null>(null)
  const runIdRef = useRef(0)
  const { addHistory } = useSettings()

  useEffect(() => {
    if (restored) return
    const runId = runIdRef.current
    void restore().then((s) => {
      // Skip if the user started something else meanwhile.
      if (s && s.status === 'done' && runId === runIdRef.current) dispatch({ ...s, type: 'done' })
      setRestored(true)
    })
  }, [restored])

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])

  const start = useCallback(
    (request: RunRequest) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      const runId = ++runIdRef.current
      dispatch({ type: 'start', request, startedAt: Date.now() })

      // Read the key at request time only; it never enters React state here.
      const apiKey = getApiKey()

      void loadClient().then(({ runPagespeed, toPsiError }) =>
        Promise.allSettled(
          request.strategies.map((strategy) =>
            runPagespeed(
              {
                url: request.url,
                strategy,
                categories: request.categories,
                locale: request.locale,
                apiKey,
              },
              { signal: controller.signal },
            ),
          ),
        ).then((results) => {
          if (runId !== runIdRef.current) return
          controllerRef.current = null

          const reports: Partial<Record<Strategy, Report>> = {}
          const errors: Partial<Record<Strategy, PsiError>> = {}
          results.forEach((r, i) => {
            const strategy = request.strategies[i]
            if (!strategy) return
            if (r.status === 'fulfilled') reports[strategy] = r.value
            else errors[strategy] = toPsiError(r.reason)
          })

          const ok = Object.values(reports)
          if (ok.length === 0) {
            const first = Object.values(errors)[0] ?? toPsiError(new Error('No result'))
            dispatch({ type: 'error', request, error: first })
            return
          }
          const now = Date.now()
          ok.forEach((rep, i) => addHistory(toHistoryEntry(rep, now + i, request.url)))
          setLastRun({
            savedAt: now,
            isSample: false,
            url: request.url,
            results: ok.map((rep) => ({ strategy: rep.strategy, raw: rep.raw })),
          })
          dispatch({ type: 'done', request, reports, errors, isSample: false })
        }),
      )
    },
    [addHistory],
  )

  const loadSample = useCallback(async () => {
    cancel()
    const runId = ++runIdRef.current
    const request: RunRequest = {
      url: SAMPLE_URL,
      strategies: ['mobile'],
      categories: [],
      locale: 'en',
    }
    const [mod, { parsePsiResponse }] = await Promise.all([
      import('@/fixtures/sample-report.json'),
      loadClient(),
    ])
    if (runId !== runIdRef.current) return
    const report = parsePsiResponse(mod.default, 'mobile')
    setLastRun({
      savedAt: Date.now(),
      isSample: true,
      results: [{ strategy: 'mobile', raw: mod.default }],
    })
    dispatch({ type: 'done', request, reports: { mobile: report }, errors: {}, isSample: true })
  }, [cancel])

  const reset = useCallback(() => {
    cancel()
    runIdRef.current++
    dispatch({ type: 'reset' })
  }, [cancel])

  // Abort any in-flight request if the app unmounts.
  useEffect(() => () => controllerRef.current?.abort(), [])

  const value = useMemo(
    () => ({ state, restored, start, cancel, loadSample, reset }),
    [state, restored, start, cancel, loadSample, reset],
  )
  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis must be used inside AnalysisProvider')
  return ctx
}
