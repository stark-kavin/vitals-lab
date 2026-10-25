import type { MetricId } from './ratings'

export interface MetricInfo {
  id: MetricId
  name: string
  /** One line, plain English: what the number means for a visitor. */
  short: string
  /** A few sentences for the "What's this?" popover. */
  long: string
}

export const METRIC_INFO: Record<MetricId, MetricInfo> = {
  FCP: {
    id: 'FCP',
    name: 'First Contentful Paint',
    short: 'When the first text or image shows up.',
    long: 'The moment a visitor first sees anything other than a blank screen. A fast FCP reassures people that the page is actually loading.',
  },
  LCP: {
    id: 'LCP',
    name: 'Largest Contentful Paint',
    short: 'When the main content (biggest image or text block) appears.',
    long: 'Usually the hero image or headline. It’s the closest single number to “when does the page look ready?”. One of the three Core Web Vitals.',
  },
  TBT: {
    id: 'TBT',
    name: 'Total Blocking Time',
    short: 'How long the page was too busy to respond to taps and clicks.',
    long: 'Adds up the time scripts kept the browser busy between first paint and full interactivity. It’s the lab stand-in for INP: lower TBT usually means snappier interactions.',
  },
  CLS: {
    id: 'CLS',
    name: 'Cumulative Layout Shift',
    short: 'How much things jump around while loading.',
    long: 'Measures unexpected movement, like a button sliding down just as you tap it because an ad loaded above it. It’s a score, not a time: 0 means nothing moved. One of the three Core Web Vitals.',
  },
  SI: {
    id: 'SI',
    name: 'Speed Index',
    short: 'How quickly the visible area fills in.',
    long: 'Looks at the loading filmstrip and scores how fast the screen goes from empty to complete. Pages that paint progressively score better than ones that pop in all at once at the end.',
  },
  TTI: {
    id: 'TTI',
    name: 'Time to Interactive',
    short: 'When the page could reliably respond to input.',
    long: 'An older metric Lighthouse still reports in some versions. It no longer affects the score; TBT and INP replaced it.',
  },
  INP: {
    id: 'INP',
    name: 'Interaction to Next Paint',
    short: 'How quickly the page reacts when someone taps, clicks or types.',
    long: 'Measured on real visitors only. It reports one of the slowest reactions across a visit, so a single sluggish menu can drag it down. One of the three Core Web Vitals.',
  },
  TTFB: {
    id: 'TTFB',
    name: 'Time to First Byte',
    short: 'How long the server takes to start answering.',
    long: 'Covers redirects, DNS, connection setup and the server thinking time before the first byte arrives. Everything else waits on it, so a slow TTFB slows every other metric.',
  },
}

export const LAB_METRIC_AUDITS: { id: MetricId; audit: string }[] = [
  { id: 'FCP', audit: 'first-contentful-paint' },
  { id: 'LCP', audit: 'largest-contentful-paint' },
  { id: 'TBT', audit: 'total-blocking-time' },
  { id: 'CLS', audit: 'cumulative-layout-shift' },
  { id: 'SI', audit: 'speed-index' },
  { id: 'TTI', audit: 'interactive' },
]

export const CATEGORY_INFO: Record<string, { short: string; blurb: string }> = {
  performance: {
    short: 'Speed',
    blurb: 'How fast the page loads and becomes usable, measured in a simulated visit.',
  },
  accessibility: {
    short: 'Access',
    blurb: 'Automated checks for things that block people using screen readers, keyboards or zoom.',
  },
  'best-practices': {
    short: 'Practices',
    blurb: 'Security, modern browser features and common mistakes.',
  },
  seo: {
    short: 'SEO',
    blurb: 'Basics that help search engines find and understand the page.',
  },
}
