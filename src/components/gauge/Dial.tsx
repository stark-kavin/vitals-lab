import { animate } from 'motion'
import { useEffect, useState } from 'react'
import { RatingMark } from '@/components/shared/RatingBadge'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { rateScore } from '@/lib/ratings'
import { cn } from '@/lib/utils'

/** 240° panel meter. 0 sits at -120°, 100 at +120°, measured clockwise from 12 o'clock. */
const SWEEP = 240
const START = -SWEEP / 2
const CX = 100
const CY = 96
const R_TICK = 78

function polar(deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function arc(from: number, to: number, r: number) {
  const a = polar(START + (from / 100) * SWEEP, r)
  const b = polar(START + (to / 100) * SWEEP, r)
  const large = ((to - from) / 100) * SWEEP > 180 ? 1 : 0
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`
}

const TICKS = Array.from({ length: 21 }, (_, i) => i * 5)
const NUMERALS = [0, 50, 90, 100]

export interface DialProps {
  /** 0-100, or null when the category has no score. */
  score: number | null
  label: string
  /** Delay before the sweep starts, for staggering a row of dials. */
  delay?: number
  size?: 'md' | 'sm'
  className?: string
}

export function Dial({ score, label, delay = 0, size = 'md', className }: DialProps) {
  const reduced = useReducedMotion()
  const target = score ?? 0
  const [animated, setAnimated] = useState(0)
  const rating = rateScore(score)
  const still = reduced || score == null
  const shown = still ? target : animated

  useEffect(() => {
    if (still) return
    const controls = animate(0, target, {
      duration: 0.95,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setAnimated(v),
    })
    return () => controls.stop()
  }, [target, delay, still])

  const angle = START + (shown / 100) * SWEEP
  const tone =
    rating === 'good'
      ? 'var(--good)'
      : rating === 'poor'
        ? 'var(--poor)'
        : rating
          ? 'var(--warn)'
          : 'var(--ink-2)'

  return (
    <figure className={cn('flex flex-col items-center', className)}>
      {/* The visible numeral is drawn in the SVG; assistive tech gets the value from the caption. */}
      <svg
        viewBox="0 0 200 150"
        aria-hidden
        className={cn('w-full', size === 'md' ? 'max-w-[220px]' : 'max-w-[150px]')}
      >
        {/* Zone band: poor / needs work / good */}
        <g fill="none" strokeWidth="5" strokeLinecap="butt" opacity="0.55">
          <path d={arc(0, 49.5, 88)} stroke="var(--poor)" />
          <path d={arc(50.5, 89.5, 88)} stroke="var(--warn)" />
          <path d={arc(90.5, 100, 88)} stroke="var(--good)" />
        </g>

        {/* Printed scale */}
        <g stroke="var(--ink)" strokeLinecap="round">
          {TICKS.map((t) => {
            const major = t % 10 === 0
            const deg = START + (t / 100) * SWEEP
            const a = polar(deg, R_TICK)
            const b = polar(deg, R_TICK - (major ? 9 : 5))
            return (
              <line
                key={t}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeWidth={major ? 1.4 : 0.8}
                opacity={major ? 0.9 : 0.5}
              />
            )
          })}
        </g>
        <g
          fill="var(--ink-2)"
          fontFamily="var(--font-mono)"
          fontSize="8.5"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {NUMERALS.map((n) => {
            const p = polar(START + (n / 100) * SWEEP, 58)
            return (
              <text key={n} x={p.x} y={p.y}>
                {n}
              </text>
            )
          })}
        </g>

        {/* Needle */}
        <g transform={`rotate(${angle} ${CX} ${CY})`}>
          <line
            x1={CX}
            y1={CY + 12}
            x2={CX}
            y2={CY - 72}
            stroke={score == null ? 'var(--ink-2)' : 'var(--ink)'}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <circle cx={CX} cy={CY} r="6.5" fill="var(--ink)" />
        <circle cx={CX} cy={CY} r="2.2" fill="var(--plate)" />

        {/* Readout window */}
        <rect x="68" y="112" width="64" height="32" rx="5" fill="var(--well)" />
        <rect
          x="68.5"
          y="112.5"
          width="63"
          height="31"
          rx="4.5"
          fill="none"
          stroke="var(--ink)"
          strokeOpacity="0.12"
        />
        <text
          x={CX}
          y="129"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-mono)"
          fontSize="21"
          fontWeight="500"
          fill={tone}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {score == null ? '–' : Math.round(shown)}
        </text>
      </svg>
      <figcaption className="mt-1 flex flex-col items-center gap-0.5 text-center">
        <span className="font-label text-[1.0625rem] leading-tight text-ink">
          {label}
          <span className="sr-only">{score == null ? ', no score' : `: ${score} out of 100,`}</span>
        </span>
        {rating ? (
          <RatingMark rating={rating} className="text-sm" />
        ) : (
          <span className="text-sm text-ink-2">No score</span>
        )}
      </figcaption>
    </figure>
  )
}
