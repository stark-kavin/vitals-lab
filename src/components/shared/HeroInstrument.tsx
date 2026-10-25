/**
 * Decorative hero illustration for the home page: a bench instrument mid-
 * measurement. Pure SVG + CSS animation (no image requests), themed through
 * the color tokens, and frozen under prefers-reduced-motion.
 */

const CX = 150
const CY = 150
const START = -120
const SWEEP = 240

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

const TICKS = Array.from({ length: 41 }, (_, i) => i * 2.5)

const READOUTS = [
  { label: 'LCP', value: '1.9 s', y: 52 },
  { label: 'INP', value: '140 ms', y: 120 },
  { label: 'CLS', value: '0.03', y: 188 },
]

// A trace that wanders like a scope reading; drawn twice for a seamless loop.
const TRACE =
  'M0 30 C 20 30, 26 8, 40 10 S 62 42, 80 36 S 104 6, 122 14 S 146 40, 160 30 S 184 12, 200 22 S 228 44, 240 30'

export function HeroInstrument({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 440" className={className} aria-hidden>
      <defs>
        <linearGradient id="hi-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--plate)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--plate) 88%, var(--well))" />
        </linearGradient>
        <radialGradient id="hi-glow" cx="0.5" cy="0.55" r="0.55">
          <stop offset="0" stopColor="var(--signal)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--signal)" stopOpacity="0" />
        </radialGradient>
        <clipPath id="hi-scope">
          <rect x="30" y="338" width="460" height="70" rx="10" />
        </clipPath>
      </defs>

      {/* Panel */}
      <rect
        x="6"
        y="6"
        width="508"
        height="428"
        rx="22"
        fill="url(#hi-plate)"
        stroke="var(--rule)"
      />
      <rect
        x="6.5"
        y="6.5"
        width="507"
        height="427"
        rx="21.5"
        fill="none"
        stroke="var(--plate)"
        strokeOpacity="0.6"
      />
      {[
        [24, 24],
        [496, 24],
        [24, 416],
        [496, 416],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <circle r="5" fill="var(--well)" stroke="var(--rule)" />
          <path d="M -2.6 0 H 2.6" stroke="var(--ink-2)" strokeWidth="1.2" />
        </g>
      ))}

      {/* Dial */}
      <g transform="translate(20 20)">
        <circle cx={CX} cy={CY} r="128" fill="url(#hi-glow)" />
        <circle cx={CX} cy={CY} r="118" fill="var(--well)" opacity="0.55" />
        <g fill="none" strokeWidth="7">
          <path d={arc(0, 49.5, 108)} stroke="var(--poor)" opacity="0.55" />
          <path d={arc(50.5, 89.5, 108)} stroke="var(--warn)" opacity="0.55" />
          <path d={arc(90.5, 100, 108)} stroke="var(--good)" opacity="0.8" />
        </g>
        <g stroke="var(--ink)" strokeLinecap="round">
          {TICKS.map((t) => {
            const major = t % 10 === 0
            const deg = START + (t / 100) * SWEEP
            const a = polar(deg, 98)
            const b = polar(deg, 98 - (major ? 12 : 6))
            return (
              <line
                key={t}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeWidth={major ? 1.6 : 0.9}
                opacity={major ? 0.85 : 0.4}
              />
            )
          })}
        </g>
        <g
          fill="var(--ink-2)"
          fontFamily="var(--font-mono)"
          fontSize="11"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {[0, 25, 50, 75, 90, 100].map((n) => {
            const p = polar(START + (n / 100) * SWEEP, 72)
            return (
              <text key={n} x={p.x} y={p.y}>
                {n}
              </text>
            )
          })}
        </g>
        <g className="vl-hero-needle" style={{ transformOrigin: `${CX}px ${CY}px` }}>
          <line
            x1={CX}
            y1={CY + 18}
            x2={CX}
            y2={CY - 92}
            stroke="var(--signal)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <circle cx={CX} cy={CY} r="10" fill="var(--ink)" />
        <circle cx={CX} cy={CY} r="3.5" fill="var(--plate)" />
        <rect x={CX - 46} y={CY + 34} width="92" height="44" rx="8" fill="var(--panel)" />
        <rect
          x={CX - 45.5}
          y={CY + 34.5}
          width="91"
          height="43"
          rx="7.5"
          fill="none"
          stroke="var(--ink)"
          strokeOpacity="0.14"
        />
        <text
          x={CX}
          y={CY + 57}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-mono)"
          fontSize="28"
          fontWeight="500"
          fill="var(--good)"
          className="vl-hero-readout"
        >
          96
        </text>
      </g>

      {/* Readouts */}
      <g transform="translate(340 34)">
        {READOUTS.map((r, i) => (
          <g
            key={r.label}
            transform={`translate(0 ${r.y - 52})`}
            className="vl-hero-chip"
            style={{ animationDelay: `${0.9 + i * 0.18}s` }}
          >
            <rect width="150" height="56" rx="10" fill="var(--plate)" stroke="var(--rule)" />
            <circle cx="20" cy="28" r="5" fill="var(--good)" />
            <circle cx="20" cy="28" r="9" fill="var(--good)" opacity="0.18" />
            <text x="36" y="22" fontFamily="var(--font-sans)" fontSize="11" fill="var(--ink-2)">
              {r.label}
            </text>
            <text
              x="36"
              y="41"
              fontFamily="var(--font-mono)"
              fontSize="16"
              fontWeight="500"
              fill="var(--ink)"
            >
              {r.value}
            </text>
          </g>
        ))}
        {/* Tiny filmstrip */}
        <g transform="translate(0 200)">
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${i * 31} 0)`}>
              <rect width="26" height="44" rx="3" fill="var(--panel)" stroke="var(--rule)" />
              {i > 0 && (
                <rect x="4" y="5" width="18" height="4" rx="1" fill="var(--ink-2)" opacity="0.6" />
              )}
              {i > 1 && (
                <rect
                  x="4"
                  y="12"
                  width="18"
                  height="12"
                  rx="1.5"
                  fill="var(--signal)"
                  opacity="0.35"
                />
              )}
              {i > 2 && (
                <rect
                  x="4"
                  y="27"
                  width="14"
                  height="2.5"
                  rx="1"
                  fill="var(--ink-2)"
                  opacity="0.45"
                />
              )}
              {i > 3 && (
                <rect
                  x="4"
                  y="32"
                  width="16"
                  height="2.5"
                  rx="1"
                  fill="var(--ink-2)"
                  opacity="0.45"
                />
              )}
            </g>
          ))}
        </g>
      </g>

      {/* Scope trace */}
      <g clipPath="url(#hi-scope)">
        <rect x="30" y="338" width="460" height="70" rx="10" fill="var(--well)" />
        <g stroke="var(--ink)" strokeOpacity="0.07">
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1={30 + i * 46} y1="338" x2={30 + i * 46} y2="408" />
          ))}
          <line x1="30" y1="373" x2="490" y2="373" />
        </g>
        <g className="vl-hero-trace">
          <path
            d={TRACE}
            transform="translate(30 343)"
            fill="none"
            stroke="var(--signal)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d={TRACE}
            transform="translate(270 343)"
            fill="none"
            stroke="var(--signal)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d={TRACE}
            transform="translate(510 343)"
            fill="none"
            stroke="var(--signal)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  )
}
