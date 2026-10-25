import { CircleHelp } from 'lucide-react'
import type { ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/** "What's this?" button that explains jargon in place. */
export function InfoPopover({
  title,
  children,
  label,
  className,
}: {
  title: string
  children: ReactNode
  /** Accessible name; defaults to "What is {title}?" */
  label?: string
  className?: string
}) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={label ?? `What is ${title}?`}
        className={cn(
          'inline-flex size-7 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-well hover:text-ink',
          className,
        )}
      >
        <CircleHelp className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent>
        <p className="font-label mb-1.5 text-base">{title}</p>
        <div className="space-y-2 leading-relaxed text-ink-2">{children}</div>
      </PopoverContent>
    </Popover>
  )
}
