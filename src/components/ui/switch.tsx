import * as React from 'react'
import { Switch as SwitchPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-edge bg-well p-[2px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-signal data-[state=checked]:bg-signal',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-[18px] rounded-full bg-plate shadow-[0_0_0_1px_var(--edge)] transition-transform data-[state=checked]:translate-x-5 data-[state=checked]:shadow-none"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
