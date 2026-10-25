import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useSettings } from '@/app/settings-context'
import { ConfirmButton } from '@/components/shared/ConfirmButton'
import { RatingMark } from '@/components/shared/RatingBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PsiError, runPagespeed } from '@/lib/psi-client'

type TestResult =
  | { state: 'idle' }
  | { state: 'testing' }
  | { state: 'valid' }
  | { state: 'invalid'; message: string }
  | { state: 'quota'; message: string }
  | { state: 'other'; message: string }

/** A small, fast-to-analyze public page used only to check the key. */
const TEST_URL = 'https://example.com/'

export function ApiKeyPanel() {
  const { apiKey, saveApiKey, removeApiKey } = useSettings()
  const [draft, setDraft] = useState('')
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [test, setTest] = useState<TestResult>({ state: 'idle' })
  const controller = useRef<AbortController | null>(null)
  const inputId = useId()
  const helpId = useId()

  useEffect(() => () => controller.current?.abort(), [])

  function onSave(e: FormEvent) {
    e.preventDefault()
    const value = draft.trim()
    if (!value) return
    const persisted = saveApiKey(value)
    setDraft('')
    setShow(false)
    setTest({ state: 'idle' })
    setSaved(
      persisted
        ? 'Key saved in this browser.'
        : 'Key saved for this tab only: your browser is blocking storage.',
    )
  }

  async function onTest() {
    const key = draft.trim() || apiKey
    if (!key) return
    controller.current?.abort()
    const c = new AbortController()
    controller.current = c
    setTest({ state: 'testing' })
    try {
      await runPagespeed(
        { url: TEST_URL, strategy: 'desktop', categories: ['seo'], locale: 'en', apiKey: key },
        { signal: c.signal, timeoutMs: 60_000 },
      )
      setTest({ state: 'valid' })
    } catch (err) {
      if (c.signal.aborted) return
      const e = err instanceof PsiError ? err : null
      if (e?.kind === 'bad-key') setTest({ state: 'invalid', message: e.message })
      else if (e?.kind === 'quota')
        setTest({ state: 'quota', message: 'The key works, but its quota is used up for now.' })
      else if (e?.kind === 'site')
        // Google ran Lighthouse, so the key itself was accepted.
        setTest({ state: 'valid' })
      else setTest({ state: 'other', message: e?.message ?? 'The test request failed. Try again.' })
    }
  }

  return (
    <section aria-labelledby="key-title" className="plate p-5 sm:p-7">
      <div className="flex items-start gap-4">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-control bg-well"
          aria-hidden
        >
          <KeyRound className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="key-title" className="font-display text-[1.75rem]">
            API key
          </h2>
          <p className="mt-1 max-w-[60ch] text-ink-2">
            Optional. Without a key, every Vitals Lab user shares Google’s small anonymous quota, so
            tests often fail with a rate limit. Your own free key gives you a private quota.
          </p>

          <p className="mt-4 flex items-center gap-2 text-ink" role="status">
            {apiKey ? (
              <>
                <RatingMark rating="good" label="Key saved" />
                <span className="num-narrow text-sm text-ink-2" aria-label="ending in">
                  •••• {apiKey.slice(-4)}
                </span>
              </>
            ) : (
              <span className="text-ink-2">No key saved. Tests use the shared quota.</span>
            )}
          </p>

          <form onSubmit={onSave} className="mt-5">
            <label htmlFor={inputId} className="font-label text-[0.9375rem]">
              {apiKey ? 'Replace key' : 'Paste your key'}
            </label>
            <div className="mt-2 flex max-w-xl gap-2">
              <div className="relative flex-1">
                <Input
                  id={inputId}
                  type={show ? 'text' : 'password'}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="off"
                  placeholder="AIza…"
                  aria-describedby={helpId}
                  className="num-narrow pr-11 text-[0.9375rem]"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide key' : 'Show key'}
                  aria-pressed={show}
                  className="absolute top-1/2 right-1 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-[6px] text-ink-2 hover:bg-well hover:text-ink"
                >
                  {show ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
              <Button type="submit" disabled={!draft.trim()}>
                Save
              </Button>
            </div>
            <p id={helpId} className="mt-2 text-sm text-ink-2">
              Stored only in this browser’s local storage. Sent only to googleapis.com with each
              test.
            </p>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void onTest()}
              disabled={(!draft.trim() && !apiKey) || test.state === 'testing'}
            >
              {test.state === 'testing'
                ? 'Testing key…'
                : draft.trim()
                  ? 'Test this key'
                  : 'Test saved key'}
            </Button>
            {apiKey && (
              <ConfirmButton
                title="Remove your API key?"
                description="Tests will go back to the shared quota and may hit rate limits. You can paste the key again any time."
                confirmLabel="Remove key"
                onConfirm={() => {
                  removeApiKey()
                  setTest({ state: 'idle' })
                  setSaved('Key removed.')
                }}
              >
                Remove key
              </ConfirmButton>
            )}
          </div>

          <div aria-live="polite" className="mt-3 min-h-6 text-[0.9375rem]">
            {test.state === 'testing' && (
              <p className="text-ink-2">
                Running a small test on example.com. This takes about 10 seconds.
              </p>
            )}
            {test.state === 'valid' && <RatingMark rating="good" label="The key works." />}
            {test.state === 'invalid' && (
              <RatingMark rating="poor" label={`Invalid key. ${test.message}`} />
            )}
            {test.state === 'quota' && <RatingMark rating="needs-work" label={test.message} />}
            {test.state === 'other' && <RatingMark rating="needs-work" label={test.message} />}
            {test.state === 'idle' && saved && <p className="text-ink-2">{saved}</p>}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 border-t border-rule pt-6 md:grid-cols-2">
        <div>
          <h3 className="font-label text-lg">Get a free key</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[0.9375rem] text-ink-2 marker:font-mono marker:text-ink">
            <li>
              Open the{' '}
              <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
                Google Cloud Console
              </a>{' '}
              and pick or create a project.
            </li>
            <li>
              Enable the{' '}
              <a
                href="https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                PageSpeed Insights API
              </a>
              .
            </li>
            <li>Go to APIs &amp; Services, Credentials, then Create credentials, API key.</li>
            <li>Restrict the key (below), then paste it here.</li>
          </ol>
        </div>
        <div className="rounded-control bg-warn-soft p-4 text-[0.9375rem] text-ink">
          <h3 className="font-label flex items-center gap-2 text-lg">
            <ShieldCheck className="size-5" aria-hidden /> Restrict your key
          </h3>
          <p className="mt-2">
            A key stored in a browser can be read by anyone using this browser and by installed
            extensions. Limit the damage if it leaks:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Under <em>Application restrictions</em>, choose <em>Websites</em> and add this app’s
              address
              {typeof window !== 'undefined' && window.location.origin.startsWith('http') && (
                <>
                  {' '}
                  (<code>{window.location.origin}/*</code>)
                </>
              )}
              .
            </li>
            <li>
              Under <em>API restrictions</em>, allow only the PageSpeed Insights API.
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
