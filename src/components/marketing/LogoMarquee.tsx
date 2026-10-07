import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type ClientLogo = {
  name: string
  glyph: ReactNode
  className?: string
}

/** Simple monochrome geometric marks — stand-ins for client logos. */
const marks = {
  triangle: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <path d="M12 3 21 20H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  orbit: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="10" ry="5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  stack: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" fill="currentColor" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  hex: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <path
        d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  wave: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <path
        d="M2 14c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 5 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M2 19c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 5 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" />
    </svg>
  ),
  ring: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.4" strokeDasharray="34 18" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <circle cx="7" cy="7" r="2.6" fill="currentColor" />
      <circle cx="17" cy="7" r="2.6" fill="currentColor" />
      <circle cx="7" cy="17" r="2.6" fill="currentColor" />
      <circle cx="17" cy="17" r="2.6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
}

const clients: ClientLogo[] = [
  { name: 'Northline', glyph: marks.triangle, className: 'font-semibold tracking-[-0.02em]' },
  { name: 'ACME Studio', glyph: marks.stack, className: 'font-bold tracking-[0.08em] uppercase text-[13px]' },
  { name: 'Luminex', glyph: marks.orbit, className: 'font-medium tracking-[0.18em] uppercase text-[13px]' },
  { name: 'Nordic Fit', glyph: marks.bolt, className: 'font-bold tracking-[-0.03em]' },
  { name: 'Harbor Legal', glyph: marks.hex, className: 'font-semibold tracking-[0.04em]' },
  { name: 'Verde Coffee', glyph: marks.wave, className: 'font-medium italic' },
  { name: 'Atlas Conseil', glyph: marks.ring, className: 'font-semibold tracking-[0.12em] uppercase text-[13px]' },
  { name: 'Meridian', glyph: marks.grid, className: 'font-bold tracking-[-0.02em]' },
]

function LogoItem({ logo }: { logo: ClientLogo }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-2 text-ink-faint transition-all duration-300 hover:text-accent',
        logo.className,
      )}
    >
      {logo.glyph}
      <span className="text-[15px] whitespace-nowrap">{logo.name}</span>
    </span>
  )
}

/** Infinite right-to-left marquee of client logos. Pauses on hover. */
export function LogoMarquee({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden py-4',
        '[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]',
        className,
      )}
    >
      <div className="flex w-max animate-marquee gap-12 pr-12 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {clients.map((logo) => (
          <LogoItem key={`a-${logo.name}`} logo={logo} />
        ))}
        {clients.map((logo) => (
          <LogoItem key={`b-${logo.name}`} logo={logo} />
        ))}
      </div>
    </div>
  )
}
