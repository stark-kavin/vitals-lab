/**
 * Shared PSI constants and types. Kept free of runtime dependencies so any
 * module can import it cheaply; the zod schemas live in `psi-schemas.ts`.
 */

export const STRATEGIES = ['mobile', 'desktop'] as const
export type Strategy = (typeof STRATEGIES)[number]

export const CATEGORY_IDS = ['performance', 'accessibility', 'best-practices', 'seo'] as const
export type CategoryId = (typeof CATEGORY_IDS)[number]

export type {
  Audit,
  AuditDetails,
  AuditRef,
  Category,
  CategoryGroup,
  LoadingExperience,
  PsiResponse,
} from './psi-schemas'

import type { Audit, Category, CategoryGroup, LoadingExperience } from './psi-schemas'

/** The normalized shape the UI renders. Built by `parsePsiResponse`. */
export interface Report {
  requestedUrl: string
  finalUrl: string
  strategy: Strategy
  fetchTime: string | null
  lighthouseVersion: string | null
  categories: Category[]
  categoryGroups: Record<string, CategoryGroup>
  audits: Record<string, Audit>
  loadingExperience: LoadingExperience | null
  originLoadingExperience: LoadingExperience | null
  runtimeError: { code: string; message?: string } | null
  /** The untouched response, kept for "Download JSON". */
  raw: unknown
}
