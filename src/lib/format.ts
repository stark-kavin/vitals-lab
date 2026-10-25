/** 840 -> "840 ms", 1234 -> "1.2 s", 12500 -> "12.5 s". */
export function formatMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '–'
  if (Math.abs(ms) < 1000) return `${Math.round(ms)} ms`
  const s = ms / 1000
  return `${s.toFixed(s >= 100 ? 0 : 1)} s`
}

/** 1536 -> "1.5 KiB". Uses binary units, as Lighthouse does. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return '–'
  const abs = Math.abs(bytes)
  if (abs < 1024) return `${Math.round(bytes)} B`
  if (abs < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`
}

/** CLS is shown with up to 3 decimals, trimmed: 0.1 -> "0.1", 0.0123 -> "0.012". */
export function formatCls(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '–'
  if (value === 0) return '0'
  return String(Number(value.toFixed(3)))
}

export function formatPercent(proportion: number): string {
  return `${Math.round(proportion * 100)}%`
}

export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat('en', { maximumFractionDigits }).format(value)
}

export function formatDateTime(iso: string | number | null | undefined): string {
  if (iso == null) return '–'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '–'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

/** "just now", "5 min ago", "3 h ago", "2 days ago", then a date. */
export function formatRelative(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp)
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(timestamp))
}

/** 75 seconds -> "1:15". */
export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Strip protocol and trailing slash for display: "https://a.com/" -> "a.com". */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}
