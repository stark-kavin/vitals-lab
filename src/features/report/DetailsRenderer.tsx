import { Check, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { formatBytes, formatMs, formatNumber } from '@/lib/format'
import { safeHref } from '@/lib/markdown-tokens'
import { cn } from '@/lib/utils'

/**
 * Renders Lighthouse `details` objects: opportunity, table, list,
 * list-section, checklist, node and network-tree, with a graceful
 * fallback for anything else. All values render as text.
 */

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)
const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined

const SILENT = new Set([
  'filmstrip',
  'screenshot',
  'debugdata',
  'treemap-data',
  'full-page-screenshot',
])
const MAX_ROWS = 15

export function DetailsRenderer({ details }: { details: unknown }) {
  if (!isObj(details)) return null
  const type = str(details.type)
  if (!type || SILENT.has(type)) return null

  switch (type) {
    case 'opportunity':
    case 'table':
      return <DetailsTable details={details} />
    case 'list':
      return <DetailsList details={details} />
    case 'list-section':
      return <ListSection details={details} />
    case 'checklist':
      return <Checklist details={details} />
    case 'node':
      return <NodeValue value={details} />
    case 'network-tree':
    case 'criticalrequestchain':
      return <NetworkTree details={details} />
    default:
      return (
        <p className="text-sm text-ink-2">
          This audit includes extra data ({type}) that isn’t shown here. Download the JSON to see
          it.
        </p>
      )
  }
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

interface Heading {
  key: string | null
  label: string
  valueType: string
  granularity?: number
  sub?: { key: string; valueType: string; granularity?: number }
}

function normaliseHeadings(raw: unknown): Heading[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isObj).map((h) => {
    const sub = isObj(h.subItemsHeading) ? h.subItemsHeading : undefined
    return {
      key: str(h.key) ?? null,
      label: str(h.label) ?? str(h.text) ?? '',
      valueType: str(h.valueType) ?? str(h.itemType) ?? 'text',
      granularity: num(h.granularity),
      sub:
        sub && str(sub.key)
          ? {
              key: str(sub.key) ?? '',
              valueType: str(sub.valueType) ?? str(h.valueType) ?? 'text',
              granularity: num(sub.granularity),
            }
          : undefined,
    }
  })
}

function DetailsTable({ details }: { details: Obj }) {
  const headings = normaliseHeadings(details.headings)
  const items = Array.isArray(details.items) ? details.items.filter(isObj) : []
  const [all, setAll] = useState(false)
  if (headings.length === 0 || items.length === 0) return null

  const shown = all ? items : items.slice(0, MAX_ROWS)
  const numericCol = (h: Heading) => ['bytes', 'ms', 'timespanMs', 'numeric'].includes(h.valueType)

  return (
    <div className="mt-3">
      <div
        className="overflow-x-auto rounded-window border border-rule"
        tabIndex={0}
        role="region"
        aria-label="Audit details"
      >
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead className="bg-well">
            <tr>
              {headings.map((h, i) => (
                <th
                  key={`${h.key}-${i}`}
                  scope="col"
                  className={cn(
                    'font-label px-3 py-2 text-[0.8125rem] text-ink-2',
                    numericCol(h) && 'text-right',
                  )}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((item, r) => {
              const subItems =
                isObj(item.subItems) && Array.isArray(item.subItems.items)
                  ? item.subItems.items.filter(isObj)
                  : []
              return (
                <RowGroup key={r}>
                  <tr className="border-t border-rule align-top">
                    {headings.map((h, i) => (
                      <td
                        key={i}
                        className={cn('px-3 py-2', numericCol(h) && 'text-right whitespace-nowrap')}
                      >
                        {h.key ? (
                          <Value
                            value={item[h.key]}
                            type={h.valueType}
                            granularity={h.granularity}
                          />
                        ) : null}
                      </td>
                    ))}
                  </tr>
                  {subItems.slice(0, 8).map((sub, s) => (
                    <tr key={`s${s}`} className="align-top text-ink-2">
                      {headings.map((h, i) => (
                        <td
                          key={i}
                          className={cn(
                            'px-3 py-1 text-[0.8125rem]',
                            i === 0 && 'pl-7',
                            h.sub &&
                              numericCol({ ...h, valueType: h.sub.valueType }) &&
                              'text-right',
                          )}
                        >
                          {h.sub ? (
                            <Value
                              value={sub[h.sub.key]}
                              type={h.sub.valueType}
                              granularity={h.sub.granularity}
                            />
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </RowGroup>
              )
            })}
          </tbody>
        </table>
      </div>
      {items.length > MAX_ROWS && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-2 text-sm text-signal underline underline-offset-4"
        >
          {all ? 'Show fewer rows' : `Show all ${items.length} rows`}
        </button>
      )}
    </div>
  )
}

function RowGroup({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

function Value({
  value,
  type,
  granularity,
}: {
  value: unknown
  type: string
  granularity?: number
}) {
  if (value == null || value === '') return null

  if (isObj(value)) {
    const t = str(value.type)
    if (t === 'node') return <NodeValue value={value} />
    if (t === 'source-location') {
      const url = str(value.url) ?? ''
      const line = num(value.line)
      const col = num(value.column)
      return (
        <UrlText
          url={url}
          suffix={line != null ? `:${line + 1}${col != null ? `:${col}` : ''}` : ''}
        />
      )
    }
    if (t === 'url') return <UrlText url={str(value.value) ?? ''} />
    if (t === 'code') return <code>{String(value.value ?? '')}</code>
    if (t === 'link') {
      const href = safeHref(str(value.url) ?? '')
      const text = str(value.text) ?? str(value.url) ?? ''
      return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ) : (
        <span>{text}</span>
      )
    }
    if (t === 'numeric')
      return <Value value={value.value} type="numeric" granularity={num(value.granularity)} />
    if (t === 'text') return <span>{String(value.value ?? '')}</span>
    const fallback = str(value.text) ?? str(value.label) ?? str(value.value)
    return fallback ? <span>{fallback}</span> : null
  }

  if (typeof value === 'number') {
    switch (type) {
      case 'bytes':
        return <span className="num-narrow">{formatBytes(value)}</span>
      case 'ms':
      case 'timespanMs':
        return <span className="num-narrow">{formatMs(value)}</span>
      default:
        return (
          <span className="num-narrow">
            {formatNumber(
              value,
              granularity != null && granularity < 1 ? Math.round(-Math.log10(granularity)) : 1,
            )}
          </span>
        )
    }
  }

  const s = String(value)
  if (type === 'url') return <UrlText url={s} />
  if (type === 'code') return <code>{s}</code>
  if (type === 'thumbnail') return null
  return <span className="break-words">{s}</span>
}

function UrlText({ url, suffix = '' }: { url: string; suffix?: string }) {
  let short = url
  try {
    const u = new URL(url)
    const path = u.pathname + u.search
    short = path.length > 1 ? `${path.length > 60 ? `…${path.slice(-58)}` : path}` : u.host
    return (
      <span className="block min-w-0 break-all" title={url}>
        <span className="text-ink">
          {short}
          {suffix}
        </span>
        <span className="ml-1.5 text-[0.75rem] text-ink-2">{u.host}</span>
      </span>
    )
  } catch {
    return (
      <span className="break-all" title={url}>
        {short || 'Unknown'}
        {suffix}
      </span>
    )
  }
}

function NodeValue({ value }: { value: Obj }) {
  const label = str(value.nodeLabel)
  const snippet = str(value.snippet)
  const selector = str(value.selector)
  return (
    <span className="flex min-w-0 flex-col gap-1">
      {label && <span className="text-ink">{label}</span>}
      {snippet && <code className="block w-fit max-w-full text-[0.75rem]">{snippet}</code>}
      {!label && !snippet && selector && <code className="text-[0.75rem]">{selector}</code>}
    </span>
  )
}

// ---------------------------------------------------------------------------
// List, sections, checklist, network tree
// ---------------------------------------------------------------------------

function DetailsList({ details }: { details: Obj }) {
  const items = Array.isArray(details.items) ? details.items : []
  if (items.length === 0) return null
  return (
    <div className="mt-3 space-y-4">
      {items.map((item, i) => (
        <DetailsRenderer key={i} details={item} />
      ))}
    </div>
  )
}

function ListSection({ details }: { details: Obj }) {
  return (
    <div>
      {str(details.title) && <p className="font-label text-sm text-ink">{str(details.title)}</p>}
      {str(details.description) && (
        <p className="mt-0.5 text-sm text-ink-2">{str(details.description)}</p>
      )}
      <DetailsRenderer details={details.value} />
    </div>
  )
}

function Checklist({ details }: { details: Obj }) {
  const items = isObj(details.items)
    ? Object.entries(details.items).filter(([, v]) => isObj(v))
    : []
  if (items.length === 0) return null
  return (
    <ul className="mt-3 space-y-1.5 text-sm">
      {items.map(([key, raw]) => {
        const v = raw as Obj
        const ok = v.value === true
        return (
          <li key={key} className="flex items-start gap-2">
            {ok ? (
              <Check className="mt-0.5 size-4 shrink-0 text-good" aria-label="Passed" />
            ) : (
              <X className="mt-0.5 size-4 shrink-0 text-poor" aria-label="Failed" />
            )}
            <span>{str(v.label) ?? key}</span>
          </li>
        )
      })}
    </ul>
  )
}

interface ChainNode {
  url: string
  time?: number
  size?: number
  longest: boolean
  children: ChainNode[]
}

function toChain(raw: unknown, depth = 0): ChainNode[] {
  if (!isObj(raw) || depth > 12) return []
  return Object.values(raw)
    .filter(isObj)
    .map((n) => {
      const req = isObj(n.request) ? n.request : n
      return {
        url: str(req.url) ?? '',
        time: num(n.navStartToEndTime) ?? num(req.endTime),
        size: num(n.transferSize) ?? num(req.transferSize),
        longest: n.isLongest === true,
        children: toChain(n.children, depth + 1),
      }
    })
}

function NetworkTree({ details }: { details: Obj }) {
  const chains = toChain(details.chains)
  if (chains.length === 0) return null
  return (
    <div
      className="mt-3 overflow-x-auto rounded-window border border-rule p-3 text-sm"
      tabIndex={0}
      role="region"
      aria-label="Request chain"
    >
      <ChainList nodes={chains} />
    </div>
  )
}

function ChainList({ nodes }: { nodes: ChainNode[] }) {
  return (
    <ul className="space-y-1 border-l border-rule pl-3 first:border-l-0 first:pl-0">
      {nodes.map((n, i) => (
        <li key={i}>
          <div className={cn('flex flex-wrap items-baseline gap-x-3', n.longest && 'font-medium')}>
            <UrlText url={n.url} />
            {n.time != null && (
              <span className="num-narrow text-[0.75rem] text-ink-2">{formatMs(n.time)}</span>
            )}
            {n.size != null && (
              <span className="num-narrow text-[0.75rem] text-ink-2">{formatBytes(n.size)}</span>
            )}
          </div>
          {n.children.length > 0 && (
            <div className="mt-1">
              <ChainList nodes={n.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
