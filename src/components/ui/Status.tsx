import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type Tone = 'healthy' | 'warning' | 'critical' | 'info' | 'neutral'

const tones: Record<Tone, string> = {
  healthy: 'bg-healthy-tint text-healthy border-healthy/20',
  warning: 'bg-warning-tint text-warning border-warning/20',
  critical: 'bg-critical-tint text-critical border-critical/20',
  info: 'bg-info-tint text-info border-info/20',
  neutral: 'bg-surface-muted text-ink-soft border-line-strong',
}

export function StatusPill({
  tone = 'neutral',
  children,
  className,
  dot = true,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {dot && <StatusDot tone={tone} />}
      {children}
    </span>
  )
}

const dotColors: Record<Tone, string> = {
  healthy: 'bg-healthy',
  warning: 'bg-warning',
  critical: 'bg-critical',
  info: 'bg-info',
  neutral: 'bg-ink-faint',
}

export function StatusDot({
  tone = 'neutral',
  pulse = false,
  className,
}: {
  tone?: Tone
  pulse?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block size-1.5 shrink-0 rounded-full',
        dotColors[tone],
        pulse && 'animate-pulse',
        className,
      )}
    />
  )
}

export function SeverityBadge({ level }: { level: 'critical' | 'warning' | 'optimization' }) {
  const map = {
    critical: { tone: 'critical' as Tone, label: 'Critical' },
    warning: { tone: 'warning' as Tone, label: 'Warning' },
    optimization: { tone: 'info' as Tone, label: 'Optimization' },
  }
  const item = map[level]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase',
        tones[item.tone],
      )}
    >
      {item.label}
    </span>
  )
}
