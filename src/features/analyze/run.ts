import type { CategoryId, Strategy } from '@/lib/psi-types'

export interface RunRequest {
  url: string
  strategies: Strategy[]
  categories: CategoryId[]
  locale: string
}

export const SAMPLE_URL = 'https://northwind-pantry.example/'

export type StrategyParam = Strategy | 'both'

export function strategiesFor(param: StrategyParam): Strategy[] {
  return param === 'both' ? ['mobile', 'desktop'] : [param]
}

export function strategyParamOf(strategies: readonly Strategy[]): StrategyParam {
  if (strategies.length > 1) return 'both'
  return strategies[0] ?? 'mobile'
}

export function parseStrategyParam(value: string | null): StrategyParam | null {
  return value === 'mobile' || value === 'desktop' || value === 'both' ? value : null
}

export function sameRequest(
  a: Pick<RunRequest, 'url' | 'strategies'>,
  b: Pick<RunRequest, 'url' | 'strategies'>,
) {
  const key = (r: Pick<RunRequest, 'url' | 'strategies'>) =>
    `${r.url}|${[...r.strategies].sort().join(',')}`
  return key(a) === key(b)
}

/** In-app route for a report. Only URL and strategy: never the API key. */
export function reportPath(url: string, strategy: StrategyParam): string {
  const p = new URLSearchParams({ url, strategy })
  return `/report?${p.toString()}`
}

/** Absolute share link for the current deployment (HashRouter). */
export function shareLink(url: string, strategy: StrategyParam): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#${reportPath(url, strategy)}`
}
