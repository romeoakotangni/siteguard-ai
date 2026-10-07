import { cn } from '../../lib/utils'
import type { Tone } from './Status'

const barColor: Record<Tone, string> = {
  healthy: 'bg-healthy',
  warning: 'bg-warning',
  critical: 'bg-critical',
  info: 'bg-info',
  neutral: 'bg-ink-faint',
}

export function MetricBar({
  label,
  value,
  percent,
  tone = 'healthy',
  hint,
  className,
}: {
  label: string
  value: string
  percent: number
  tone?: Tone
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('group', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className="text-[13px] font-semibold tabular-nums text-ink">{value}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
          <div
            className={cn('h-full rounded-full transition-[width] duration-700 ease-out', barColor[tone])}
            style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
          />
        </div>
        {hint && <span className="w-24 shrink-0 text-right text-xs text-ink-faint">{hint}</span>}
      </div>
    </div>
  )
}

/** Tiny inline sparkline — no chart library, pure SVG. */
export function Sparkline({
  data,
  tone = 'healthy',
  width = 96,
  height = 24,
  className,
}: {
  data: number[]
  tone?: Tone
  width?: number
  height?: number
  className?: string
}) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const points = data
    .map((d, i) => `${(i * step).toFixed(1)},${(height - ((d - min) / range) * (height - 4) - 2).toFixed(1)}`)
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn('overflow-visible', className)}>
      <polyline
        points={points}
        fill="none"
        stroke={`var(--color-${tone})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  )
}
