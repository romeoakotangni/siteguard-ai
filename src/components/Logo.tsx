import { cn } from '../lib/utils'

/**
 * SiteGuard mark — a shield silhouette cut by a monitoring pulse line.
 * Pure SVG, monochrome, inherits currentColor.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-6', className)}
      aria-hidden="true"
    >
      <path
        d="M12 2.5 4 5.4v5.9c0 4.6 3.2 8.4 8 9.7 4.8-1.3 8-5.1 8-9.7V5.4L12 2.5Z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M12 2.5 4 5.4v5.9c0 4.6 3.2 8.4 8 9.7 4.8-1.3 8-5.1 8-9.7V5.4L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 12.2h2.2l1.4-3 1.9 5 1.3-2.4h2.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className="size-6 text-accent" />
      {!compact && (
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          SiteGuard<span className="text-ink-muted"> AI</span>
        </span>
      )}
    </span>
  )
}
