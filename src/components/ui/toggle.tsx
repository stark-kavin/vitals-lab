import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Toggle as TogglePrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

const toggleVariants = cva(
  "font-label inline-flex items-center justify-center gap-2 text-[0.9375rem] whitespace-nowrap text-ink-2 transition-[background-color,color,border-color] duration-150 hover:text-ink disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Segmented switch: the selected position reads like a lit key.
        default:
          'rounded-[6px] data-[state=on]:bg-plate data-[state=on]:text-ink data-[state=on]:shadow-[0_0_0_1px_var(--edge)]',
        // Chips: fill with the signal tint when on.
        outline:
          'rounded-chip border border-edge bg-transparent data-[state=on]:border-signal data-[state=on]:bg-signal-soft data-[state=on]:text-ink',
      },
      size: {
        default: 'h-9 min-w-9 px-3',
        sm: 'h-8 min-w-8 px-2.5 text-sm',
        lg: 'h-10 min-w-10 px-4',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
