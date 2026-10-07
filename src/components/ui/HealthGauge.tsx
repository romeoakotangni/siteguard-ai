import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

function scoreTone(score: number) {
  if (score >= 90) return { stroke: 'var(--color-healthy)', label: 'Healthy' }
  if (score >= 70) return { stroke: 'var(--color-warning)', label: 'Needs attention' }
  return { stroke: 'var(--color-critical)', label: 'Critical' }
}

/** Semicircle health gauge — calm, precise, no gimmick. */
export function HealthGauge({
  score,
  label = 'Global health score',
  size = 260,
  animate = true,
}: {
  score: number
  label?: string
  size?: number
  animate?: boolean
}) {
  const [animated, setAnimated] = useState(0)
  const raf = useRef<number>(undefined)

  useEffect(() => {
    if (!animate) return
    const start = performance.now()
    const duration = 900
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimated(Math.round(score * eased))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [score, animate])

  const display = animate ? animated : score

  const tone = scoreTone(score)
  const stroke = 14
  const r = size / 2 - stroke
  const cx = size / 2
  const cy = size / 2
  const circumference = Math.PI * r // semicircle
  const progress = circumference * (display / 100)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`}>
        <path
          d={`M ${stroke} ${cy} A ${r} ${r} 0 0 1 ${size - stroke} ${cy}`}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${stroke} ${cy} A ${r} ${r} 0 0 1 ${size - stroke} ${cy}`}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className="transition-[stroke-dasharray] duration-100 ease-out"
        />
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          className="fill-ink font-semibold"
          style={{ fontSize: size / 5.2 }}
        >
          {display}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          className="fill-ink-faint"
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          / 100
        </text>
      </svg>
      <p className="mt-1 text-[13px] font-medium text-ink-soft">{label}</p>
      <p className="text-xs text-ink-faint">{tone.label}</p>
    </div>
  )
}

/** Compact circular score used in rows and previews. */
export function ScoreChip({ score, className }: { score: number; className?: string }) {
  const tone = scoreTone(score)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-0.5 text-[13px] font-semibold tabular-nums',
        className,
      )}
      style={{ color: tone.stroke }}
    >
      <span className="size-1.5 rounded-full" style={{ background: tone.stroke }} />
      {score}
    </span>
  )
}
