import { Check, ClipboardCopy, Download, Link2, RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { copyText, downloadFile } from '@/lib/clipboard'
import { getApiKey } from '@/lib/storage'
import { redactKey } from '@/lib/psi-client'
import type { Report } from '@/lib/psi-types'
import { plainTextSummary } from '@/lib/report-model'
import { shareLink, type StrategyParam } from '../analyze/run'

type Done = 'summary' | 'link' | 'download' | null

export function ReportActions({
  report,
  shareUrl,
  shareStrategy,
  isSample,
  onRerun,
}: {
  report: Report
  shareUrl: string
  shareStrategy: StrategyParam
  isSample: boolean
  onRerun: () => void
}) {
  const [done, setDone] = useState<Done>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => setDone(null), 2500)
    return () => window.clearTimeout(t)
  }, [done])

  async function copy(kind: 'summary' | 'link') {
    const text = kind === 'summary' ? plainTextSummary(report) : shareLink(shareUrl, shareStrategy)
    const ok = await copyText(text)
    setFailed(!ok)
    setDone(ok ? kind : null)
  }

  function download() {
    let host = 'report'
    try {
      host = new URL(report.finalUrl).hostname
    } catch {
      /* keep default */
    }
    const date = (report.fetchTime ?? new Date().toISOString()).slice(0, 10)
    // The PSI response never contains the key, but redact anyway before it leaves the app.
    const json = redactKey(JSON.stringify(report.raw, null, 2), getApiKey())
    downloadFile(`vitals-lab_${host}_${report.strategy}_${date}.json`, json)
    setDone('download')
  }

  const icon = (kind: Done, Icon: typeof Download) =>
    done === kind ? <Check aria-hidden className="text-good" /> : <Icon aria-hidden />

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {!isSample && (
          <Button variant="default" onClick={onRerun} className="col-span-2 lg:col-span-1">
            <RotateCw aria-hidden /> Re-run test
          </Button>
        )}
        <Button variant="outline" onClick={() => void copy('summary')}>
          {icon('summary', ClipboardCopy)} Copy summary
        </Button>
        <Button variant="outline" onClick={() => void copy('link')}>
          {icon('link', Link2)} Copy share link
        </Button>
        <Button variant="outline" onClick={download} className="col-span-2 lg:col-span-1">
          {icon('download', Download)} Download JSON
        </Button>
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-ink-2">
        {done === 'summary' && 'Summary copied.'}
        {done === 'link' && 'Link copied. It contains only the address and device, never your key.'}
        {done === 'download' && 'Download started.'}
        {failed && 'Couldn’t copy. Your browser blocked clipboard access.'}
      </p>
    </div>
  )
}
