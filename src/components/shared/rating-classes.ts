import type { Rating } from '@/lib/ratings'

export const TEXT = { good: 'text-good', 'needs-work': 'text-warn', poor: 'text-poor' } as const
export const SOFT = {
  good: 'bg-good-soft',
  'needs-work': 'bg-warn-soft',
  poor: 'bg-poor-soft',
} as const
export const FILL = { good: 'bg-good', 'needs-work': 'bg-warn', poor: 'bg-poor' } as const

export function ratingTextClass(rating: Rating | null): string {
  return rating ? TEXT[rating] : 'text-ink-2'
}
