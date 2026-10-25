import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "font-label inline-flex shrink-0 items-center justify-center gap-2 rounded-control text-[0.9375rem] whitespace-nowrap transition-[background-color,color,border-color,transform] duration-150 select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-signal text-signal-ink hover:bg-[color-mix(in_oklab,var(--signal)_86%,var(--ink))]',
        destructive: 'bg-poor text-plate hover:bg-[color-mix(in_oklab,var(--poor)_86%,var(--ink))]',
        outline: 'border border-edge bg-plate text-ink hover:border-ink',
        secondary: 'bg-well text-ink hover:bg-[color-mix(in_oklab,var(--well)_85%,var(--ink))]',
        ghost: 'text-ink hover:bg-well',
        link: 'h-auto px-0 text-signal underline underline-offset-4 hover:decoration-2',
      },
      size: {
        default: 'h-10 px-4 has-[>svg]:px-3.5',
        sm: 'h-8 gap-1.5 px-3 text-sm has-[>svg]:px-2.5',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
