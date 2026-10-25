import { z } from 'zod/mini'

/**
 * Schemas for the parts of the PSI v5 / Lighthouse response we read.
 * Verified against Lighthouse 13.5 output. Everything is lenient: unknown
 * keys pass through, and most fields are optional because the API omits
 * them freely (e.g. no field data, no `relevantAudits`, `score: null`).
 * Only imported by the PSI client, which is loaded on demand, so zod stays
 * out of the first-load bundle.
 */

const opt = z.optional
const optStr = opt(z.string())
const optNum = opt(z.number())
const optScore = opt(z.nullable(z.number()))

export const auditDetailsSchema = z.looseObject({ type: z.string() })
export type AuditDetails = z.infer<typeof auditDetailsSchema>

export const auditSchema = z.looseObject({
  id: z.string(),
  title: z.string(),
  description: optStr,
  score: optScore,
  scoreDisplayMode: optStr,
  displayValue: optStr,
  numericValue: optNum,
  numericUnit: optStr,
  errorMessage: optStr,
  details: opt(auditDetailsSchema),
  metricSavings: opt(z.record(z.string(), z.nullable(z.number()))),
})
export type Audit = z.infer<typeof auditSchema>

export const auditRefSchema = z.looseObject({
  id: z.string(),
  weight: optNum,
  group: optStr,
  acronym: optStr,
  relevantAudits: opt(z.array(z.string())),
})
export type AuditRef = z.infer<typeof auditRefSchema>

export const categorySchema = z.looseObject({
  id: z.string(),
  title: z.string(),
  description: optStr,
  manualDescription: optStr,
  score: optScore,
  auditRefs: z._default(z.array(auditRefSchema), []),
})
export type Category = z.infer<typeof categorySchema>

export const categoryGroupSchema = z.looseObject({
  title: z.string(),
  description: optStr,
})
export type CategoryGroup = z.infer<typeof categoryGroupSchema>

export const lighthouseResultSchema = z.looseObject({
  lighthouseVersion: optStr,
  requestedUrl: optStr,
  finalUrl: optStr,
  finalDisplayedUrl: optStr,
  mainDocumentUrl: optStr,
  fetchTime: optStr,
  userAgent: optStr,
  runWarnings: opt(z.array(z.unknown())),
  runtimeError: opt(z.looseObject({ code: z.string(), message: optStr })),
  configSettings: opt(z.looseObject({ formFactor: optStr, locale: optStr })),
  // Audits and categories are validated one by one in `parsePsiResponse`
  // so a single odd entry can't sink the whole report.
  audits: z._default(z.record(z.string(), z.unknown()), {}),
  categories: z._default(z.record(z.string(), z.unknown()), {}),
  categoryGroups: opt(z.record(z.string(), categoryGroupSchema)),
})

export const cruxDistributionSchema = z.looseObject({
  min: z.number(),
  max: optNum,
  proportion: z.number(),
})

export const cruxMetricSchema = z.looseObject({
  percentile: optNum,
  distributions: opt(z.array(cruxDistributionSchema)),
  category: optStr,
})

export const loadingExperienceSchema = z.looseObject({
  id: optStr,
  metrics: opt(z.record(z.string(), cruxMetricSchema)),
  overall_category: optStr,
  initial_url: optStr,
  origin_fallback: opt(z.boolean()),
})
export type LoadingExperience = z.infer<typeof loadingExperienceSchema>

export const psiResponseSchema = z.looseObject({
  id: optStr,
  analysisUTCTimestamp: optStr,
  loadingExperience: opt(loadingExperienceSchema),
  originLoadingExperience: opt(loadingExperienceSchema),
  lighthouseResult: lighthouseResultSchema,
})
export type PsiResponse = z.infer<typeof psiResponseSchema>

export const psiErrorBodySchema = z.object({
  error: z.looseObject({
    code: optNum,
    message: optStr,
    status: optStr,
    errors: opt(z.array(z.looseObject({ reason: optStr }))),
  }),
})
