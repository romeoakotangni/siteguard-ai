import { Check, CircleAlert, Info, Sparkles, Wand2 } from 'lucide-react'
import type { ActivityEvent, IssueTimelineStep } from '../data/mock'
import { cn } from '../lib/utils'
import { StatusDot } from './ui/Status'

const kindIcon = {
  detect: CircleAlert,
  diagnose: Sparkles,
  fix: Wand2,
  approve: Check,
  verify: Check,
  info: Info,
}

const kindTone = {
  detect: 'text-warning',
  diagnose: 'text-accent',
  fix: 'text-accent',
  approve: 'text-healthy',
  verify: 'text-healthy',
  info: 'text-ink-faint',
}

/** Vertical resolution timeline — builds trust by showing every agent step. */
export function ResolutionTimeline({ steps }: { steps: IssueTimelineStep[] }) {
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const last = i === steps.length - 1
        return (
          <li key={`${step.time}-${i}`} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!last && (
              <span
                className={cn(
                  'absolute top-4 left-[5.5px] h-full w-px',
                  step.state === 'done' ? 'bg-healthy/40' : 'bg-line',
                )}
              />
            )}
            <span className="relative mt-1.5 shrink-0">
              {step.state === 'done' ? (
                <span className="block size-3 rounded-full bg-healthy ring-4 ring-healthy-tint" />
              ) : step.state === 'current' ? (
                <span className="block size-3 rounded-full bg-accent ring-4 ring-accent-tint animate-pulse-dot" />
              ) : (
                <span className="block size-3 rounded-full border-2 border-line-strong bg-surface" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <span className="font-mono text-xs tabular-nums text-ink-faint">{step.time}</span>
                <span
                  className={cn(
                    'text-[13px] font-medium',
                    step.state === 'current'
                      ? 'text-accent'
                      : step.state === 'pending'
                        ? 'text-ink-faint'
                        : 'text-ink',
                  )}
                >
                  {step.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">{step.agent}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Live agent log feed used on dashboard, agents and activity pages. */
export function ActivityFeed({
  events,
  className,
  showSite = true,
}: {
  events: ActivityEvent[]
  className?: string
  showSite?: boolean
}) {
  return (
    <ol className={cn('divide-y divide-line', className)}>
      {events.map((event) => {
        const Icon = kindIcon[event.kind]
        return (
          <li key={event.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={cn(
                'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-line bg-canvas',
                kindTone[event.kind],
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-snug text-ink">
                <span className="font-medium">{event.agent}</span>
                <span className="text-ink-muted"> — {event.message}</span>
              </p>
              {showSite && event.site && (
                <p className="mt-0.5 text-xs text-ink-faint">{event.site}</p>
              )}
            </div>
            <span className="shrink-0 font-mono text-xs tabular-nums text-ink-faint">
              {event.time}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function TimelineLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
      <span className="inline-flex items-center gap-1.5">
        <StatusDot tone="healthy" /> Completed
      </span>
      <span className="inline-flex items-center gap-1.5">
        <StatusDot tone="info" pulse /> In progress
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full border border-line-strong" /> Pending
      </span>
    </div>
  )
}
