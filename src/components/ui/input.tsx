import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-control border border-edge bg-plate px-3 text-base text-ink transition-[border-color,box-shadow] outline-none placeholder:text-ink-2',
        'focus-visible:border-signal focus-visible:shadow-[0_0_0_1px_var(--signal)] focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-poor aria-invalid:shadow-[0_0_0_1px_var(--poor)]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
