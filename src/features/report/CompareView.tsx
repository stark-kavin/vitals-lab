import { Monitor, Smartphone, SplitSquareHorizontal } from 'lucide-react'
import { Dial } from '@/components/gauge/Dial'
import { ratingTextClass } from '@/components/shared/rating-classes'
import { METRIC_INFO } from '@/lib/metric-info'
import type { Report } from '@/lib/psi-types'
import { formatMetric, getLabMetrics } from '@/lib/report-model'
import { toScore100 } from '@/lib/ratings'
import { cn } from '@/lib/utils'
import { Section } from './Section'

function Delta({
  value,
  lowerIsBetter,
  format,
}: {
  value: number
  lowerIsBetter: boolean
  format: (n: number) => string
}) {
  if (Math.abs(value) < 1e-9) return <span className="text-ink-2">same</span>
  const desktopBetter = lowerIsBetter ? value < 0 : value > 0
  return (
    <span className={cn('num-narrow', desktopBetter ? 'text-good' : 'text-poor')}>
      {value > 0 ? '+' : '−'}
      {format(Math.abs(value))}
      <span className="sr-only">{desktopBetter ? ' better on desktop' : ' worse on desktop'}</span>
    </span>
  )
}

export function CompareView({ mobile, desktop }: { mobile: Report; desktop: Report }) {
  const mLab = getLabMetrics(mobile)
  const dLab = getLabMetrics(desktop)

  return (
    <Section
      id="compare"
      icon={SplitSquareHorizontal}
      title="Mobile and desktop side by side"
      intro="Mobile is tested on a slower simulated device and network, so it almost always scores lower. Deltas show desktop relative to mobile."
    >
      <div className="plate overflow-hidden">
        <div className="grid grid-cols-2 border-b border-rule">
          {[
            { r: mobile, Icon: Smartphone, label: 'Mobile' },
            { r: desktop, Icon: Monitor, label: 'Desktop' },
          ].map(({ r, Icon, label }, col) => (
            <div
              key={label}
              className={cn('px-3 pt-4 pb-5 sm:px-5', col === 1 && 'border-l border-rule')}
            >
              <p className="font-label flex items-center gap-1.5 text-ink">
                <Icon className="size-4" aria-hidden /> {label}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-y-4">
                {r.categories.map((c, i) => (
                  <Dial
                    key={c.id}
                    score={toScore100(c.score)}
                    label={c.title}
                    size="sm"
                    delay={i * 0.06}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto" role="region" aria-label="Metric comparison" tabIndex={0}>
          <table className="w-full min-w-[26rem] border-collapse text-left">
            <caption className="sr-only">Scores and lab metrics, mobile versus desktop</caption>
            <thead className="bg-well text-[0.8125rem] text-ink-2">
              <tr>
                <th scope="col" className="font-label px-5 py-2">
                  Measure
                </th>
                <th scope="col" className="font-label px-3 py-2 text-right">
                  Mobile
                </th>
                <th scope="col" className="font-label px-3 py-2 text-right">
                  Desktop
                </th>
                <th scope="col" className="font-label px-5 py-2 text-right">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody>
              {mobile.categories.map((c) => {
                const m = toScore100(c.score)
                const d = toScore100(desktop.categories.find((x) => x.id === c.id)?.score)
                return (
                  <tr key={c.id} className="border-t border-rule">
                    <th scope="row" className="px-5 py-2.5 font-normal text-ink">
                      {c.title} score
                    </th>
                    <td className="num-narrow px-3 py-2.5 text-right">{m ?? '–'}</td>
                    <td className="num-narrow px-3 py-2.5 text-right">{d ?? '–'}</td>
                    <td className="px-5 py-2.5 text-right">
                      {m != null && d != null ? (
                        <Delta
                          value={d - m}
                          lowerIsBetter={false}
                          format={(n) => String(Math.round(n))}
                        />
                      ) : (
                        '–'
                      )}
                    </td>
                  </tr>
                )
              })}
              {mLab.map((m) => {
                const d = dLab.find((x) => x.id === m.id)
                return (
                  <tr key={m.id} className="border-t border-rule">
                    <th scope="row" className="px-5 py-2.5 font-normal text-ink">
                      {METRIC_INFO[m.id].name}
                    </th>
                    <td
                      className={`num-narrow px-3 py-2.5 text-right ${ratingTextClass(m.rating)}`}
                    >
                      {m.display}
                    </td>
                    <td
                      className={`num-narrow px-3 py-2.5 text-right ${ratingTextClass(d?.rating ?? null)}`}
                    >
                      {d?.display ?? '–'}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      {d ? (
                        <Delta
                          value={d.value - m.value}
                          lowerIsBetter
                          format={(n) => formatMetric(m.id, n)}
                        />
                      ) : (
                        '–'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  )
}
