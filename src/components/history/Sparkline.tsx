import { cn } from '@/lib/utils'

/** Tiny performance-score trend. Values are 0-100, oldest first. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null
  const w = 72
  const h = 22
  const pad = 3
  const step = (w - pad * 2) / (values.length - 1)
  const y = (v: number) => pad + (1 - v / 100) * (h - pad * 2)
  const points = values.map((v, i) => `${pad + i * step},${y(v)}`).join(' ')
  const last = values[values.length - 1] ?? 0
  const first = values[0] ?? 0
  const delta = last - first

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label={`Performance trend over ${values.length} runs: ${values.join(', ')}. ${
        delta === 0 ? 'No change' : `${delta > 0 ? 'Up' : 'Down'} ${Math.abs(delta)} points`
      }.`}
      className={cn('overflow-visible', className)}
    >
      {/* 90 and 50 guide lines: the rating boundaries */}
      <line
        x1={0}
        x2={w}
        y1={y(90)}
        y2={y(90)}
        stroke="var(--good)"
        strokeOpacity="0.45"
        strokeDasharray="2 3"
      />
      <line
        x1={0}
        x2={w}
        y1={y(50)}
        y2={y(50)}
        stroke="var(--poor)"
        strokeOpacity="0.45"
        strokeDasharray="2 3"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={pad + (values.length - 1) * step}
        cy={y(last)}
        r="2.6"
        fill="var(--signal)"
        stroke="var(--plate)"
        strokeWidth="1.5"
      />
    </svg>
  )
}
