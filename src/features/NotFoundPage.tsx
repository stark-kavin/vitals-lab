import { Link } from 'react-router'
import { Dial } from '@/components/gauge/Dial'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_auto] md:py-24">
      <div className="max-w-xl">
        <h1 className="font-display text-5xl sm:text-6xl">Nothing on this page</h1>
        <p className="mt-4 text-lg text-ink-2">
          The address doesn’t match anything in Vitals Lab. It may be an old link, or a typo.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/">Test a page</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/settings">Open settings</Link>
          </Button>
        </div>
      </div>
      <Dial score={null} label="Page not found" className="w-56" />
    </div>
  )
}
