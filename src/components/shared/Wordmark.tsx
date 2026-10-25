export function DialGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className} fill="none">
      <path
        d="M6.1 22.5A11 11 0 1 1 25.9 22.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M16 18 L22.5 9.5" stroke="var(--signal)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="16" cy="18" r="2.6" fill="currentColor" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2 text-ink">
      <DialGlyph className="size-7" />
      <span className="font-display text-[1.375rem] tracking-tight whitespace-nowrap">
        Vitals Lab
      </span>
    </span>
  )
}
