import { Monitor, MonitorSmartphone, Smartphone } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { useSettings } from '@/app/settings-context'
import { KeyStatus } from '@/components/shared/KeyStatus'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CATEGORY_IDS, type CategoryId } from '@/lib/psi-types'
import { normalizeUrl } from '@/lib/url'
import { cn } from '@/lib/utils'
import { strategiesFor, type RunRequest, type StrategyParam } from './run'

const CATEGORY_LABEL: Record<CategoryId, string> = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  'best-practices': 'Best practices',
  seo: 'SEO',
}

export interface AnalyzeFormProps {
  initialUrl?: string
  running: boolean
  onSubmit: (request: RunRequest, strategy: StrategyParam) => void
  onCancel: () => void
}

export function AnalyzeForm({ initialUrl = '', running, onSubmit, onCancel }: AnalyzeFormProps) {
  const { settings } = useSettings()
  const [value, setValue] = useState(initialUrl)
  const [error, setError] = useState<string | null>(null)
  const [strategy, setStrategy] = useState<StrategyParam>(settings.strategy)
  const [categories, setCategories] = useState<CategoryId[]>(settings.categories)
  const inputId = useId()
  const errorId = useId()
  const hintId = useId()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (running) return
    const result = normalizeUrl(value)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    setValue(result.url)
    onSubmit(
      {
        url: result.url,
        strategies: strategiesFor(strategy),
        // Keep the API's canonical order regardless of click order.
        categories: CATEGORY_IDS.filter((c) => categories.includes(c)),
        locale: settings.locale,
      },
      strategy,
    )
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Test a page" className="space-y-5">
      <div>
        <label htmlFor={inputId} className="font-label text-[1.0625rem] text-ink">
          Page address
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id={inputId}
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="example.com"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(null)
            }}
            aria-invalid={!!error}
            aria-describedby={error ? `${errorId} ${hintId}` : hintId}
            className={cn(
              'h-14 w-full min-w-0 rounded-control border border-edge bg-plate px-4 text-lg text-ink transition-[border-color,box-shadow] outline-none placeholder:text-ink-2',
              'focus-visible:border-signal focus-visible:shadow-[0_0_0_1px_var(--signal)] focus-visible:outline-none',
              error && 'border-poor shadow-[0_0_0_1px_var(--poor)]',
            )}
          />
          {running ? (
            <div className="flex gap-2">
              <Button type="submit" size="lg" disabled className="h-14 flex-1 sm:flex-none">
                Testing…
              </Button>
              <Button type="button" size="lg" variant="outline" className="h-14" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="submit" size="lg" className="h-14 px-8 text-[1.0625rem]">
              Analyze
            </Button>
          )}
        </div>
        <div aria-live="assertive" className="min-h-0">
          {error && (
            <p id={errorId} className="mt-2 text-[0.9375rem] font-medium text-poor">
              {error}
            </p>
          )}
        </div>
        <p id={hintId} className="mt-2 text-sm text-ink-2">
          Any public page. We add https:// if you leave it out.
        </p>
      </div>

      <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-10">
        <fieldset>
          <legend className="font-label mb-2 text-[0.9375rem] text-ink">Device</legend>
          <ToggleGroup
            type="single"
            value={strategy}
            onValueChange={(v) => v && setStrategy(v as StrategyParam)}
            aria-label="Device"
          >
            <ToggleGroupItem value="mobile">
              <Smartphone aria-hidden /> Mobile
            </ToggleGroupItem>
            <ToggleGroupItem value="desktop">
              <Monitor aria-hidden /> Desktop
            </ToggleGroupItem>
            <ToggleGroupItem value="both">
              <MonitorSmartphone aria-hidden /> Both
            </ToggleGroupItem>
          </ToggleGroup>
        </fieldset>

        <fieldset>
          <legend className="font-label mb-2 text-[0.9375rem] text-ink">Checks</legend>
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={categories}
            onValueChange={(v) => v.length > 0 && setCategories(v as CategoryId[])}
            aria-label="Checks to run"
          >
            {CATEGORY_IDS.map((c) => (
              <ToggleGroupItem
                key={c}
                value={c}
                aria-label={`${CATEGORY_LABEL[c]}${categories.length === 1 && categories[0] === c ? ' (at least one is required)' : ''}`}
              >
                {CATEGORY_LABEL[c]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </fieldset>
      </div>

      <KeyStatus />
    </form>
  )
}
