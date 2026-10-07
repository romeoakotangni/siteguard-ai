import { ArrowRight, Check, CircleAlert, Sparkles, Wand2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Issue } from '../data/mock'
import { cn } from '../lib/utils'
import { Button } from './ui/Button'
import { SeverityBadge } from './ui/Status'

const chainSteps = [
  { key: 'problem', label: 'Problem', icon: CircleAlert },
  { key: 'diagnosis', label: 'AI diagnosis', icon: Sparkles },
  { key: 'action', label: 'Action', icon: Wand2 },
  { key: 'result', label: 'Result', icon: Check },
] as const

/** The 4-step rail that anchors every issue surface: PROBLEM → DIAGNOSIS → ACTION → RESULT */
export function ChainRail({ activeIndex = 2 }: { activeIndex?: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {chainSteps.map((step, i) => {
        const Icon = step.icon
        const done = i < activeIndex
        const active = i === activeIndex
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                done && 'border-healthy/20 bg-healthy-tint text-healthy',
                active && 'border-accent/20 bg-accent-tint text-accent',
                !done && !active && 'border-line bg-surface-muted text-ink-faint',
              )}
            >
              <Icon className="size-3" />
              {step.label}
            </span>
            {i < chainSteps.length - 1 && (
              <ArrowRight className="size-3 text-ink-faint" aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * The signature component of SiteGuard AI:
 * a single issue card that walks through problem → AI diagnosis → proposed action → result.
 */
export function IssueChainCard({
  issue,
  siteDomain,
  compact = false,
  showChain = true,
  onReview,
}: {
  issue: Issue
  siteDomain?: string
  compact?: boolean
  showChain?: boolean
  onReview?: () => void
}) {
  const body = (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge level={issue.severity} />
            <span className="text-xs font-medium text-ink-faint">{issue.category}</span>
          </div>
          <h4 className="mt-2 text-[15px] font-semibold text-ink">{issue.title}</h4>
          <p className="mt-0.5 font-mono text-[13px] break-all text-ink-muted">{issue.path}</p>
        </div>
        {siteDomain && (
          <span className="shrink-0 rounded-md border border-line bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-soft">
            {siteDomain}
          </span>
        )}
      </div>

      {!compact && (
        <dl className="grid gap-2.5 rounded-md border border-line bg-canvas p-3.5">
          <div>
            <dt className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
              AI diagnosis
            </dt>
            <dd className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              {issue.diagnosis.split('. ')[0]}.
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
              Recommended action
            </dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-ink-soft">
              <span>{issue.recommendedFix}</span>
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12px] text-ink">
                {issue.fixDetail}
              </code>
            </dd>
          </div>
        </dl>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-ink-faint">
          Detected by <span className="font-medium text-ink-muted">{issue.detectedBy}</span>
        </span>
        <div className="flex items-center gap-2">
          {onReview ? (
            <Button size="sm" onClick={onReview}>
              Review &amp; Fix
            </Button>
          ) : (
            <Link
              to={`/app/issues/${issue.id}`}
              className="inline-flex h-8 items-center justify-center rounded-md bg-accent px-3 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Review &amp; Fix
            </Link>
          )}
          <Button size="sm" variant="ghost">
            Ignore
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <article
      className={cn(
        'rounded-lg border border-line bg-surface shadow-card transition-shadow hover:shadow-pop',
        'animate-fade-up',
        compact ? 'p-4' : 'p-5',
      )}
    >
      {showChain && (
        <div className="mb-3.5 border-b border-line pb-3.5">
          <ChainRail activeIndex={issue.status === 'resolved' ? 3 : 2} />
        </div>
      )}
      {body}
    </article>
  )
}
