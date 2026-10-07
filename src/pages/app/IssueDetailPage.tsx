import { ArrowRight, Check, Copy, ShieldCheck, Sparkles, Wand2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/app/AppLayout'
import { ResolutionTimeline } from '../../components/Timeline'
import { Button } from '../../components/ui/Button'
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel'
import { SeverityBadge, StatusPill } from '../../components/ui/Status'
import { Toggle } from '../../components/ui/Tabs'
import { EmptyState } from '../../components/ui/Table'
import { getIssue, getSite, issues as allIssues, type IssueTimelineStep } from '../../data/mock'
import { cn } from '../../lib/utils'

type Phase = 'review' | 'applying' | 'verified'

export default function IssueDetailPage() {
  const { issueId = '1042' } = useParams()
  const issue = getIssue(issueId)
  const [phase, setPhase] = useState<Phase>('review')
  const [autoApprove, setAutoApprove] = useState(false)
  const [copied, setCopied] = useState(false)
  const [steps, setSteps] = useState<IssueTimelineStep[]>(issue?.timeline ?? [])
  const [activeIssueId, setActiveIssueId] = useState(issue?.id)

  if (issue && issue.id !== activeIssueId) {
    setActiveIssueId(issue.id)
    setSteps(issue.timeline)
    setPhase('review')
  }

  if (!issue) {
    return (
      <EmptyState
        title="Issue not found"
        description="This issue may have been resolved or removed."
        action={
          <Link to="/app/issues">
            <Button variant="secondary">Back to issues</Button>
          </Link>
        }
      />
    )
  }

  const site = getSite(issue.siteId)
  const resolved = phase === 'verified'

  function applyFix() {
    setPhase('applying')
    const next: IssueTimelineStep[] = [
      { time: '10:48', agent: 'Workflow', label: 'Fix approved', state: 'done' },
      { time: '10:48', agent: 'Fix Agent', label: 'Correction applied', state: 'done' },
      { time: '10:49', agent: 'Monitor Agent', label: 'Verification completed · HTTP 200', state: 'done' },
      { time: '10:49', agent: 'Workflow', label: 'Issue resolved', state: 'done' },
    ]
    setTimeout(() => {
      setSteps((prev) => {
        const kept = prev.filter(
          (s) => !['Apply correction', 'Verify fix · confirm 200', 'Issue resolved'].includes(s.label),
        )
        return [...kept, ...next]
      })
      setPhase('verified')
    }, 1400)
  }

  function copyFix() {
    navigator.clipboard?.writeText(issue?.fixDetail ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <>
      <PageHeader
        breadcrumb={
          <span className="flex items-center gap-1.5">
            <Link to="/app/issues" className="hover:text-ink">
              Issues
            </Link>
            <span className="text-ink-faint">/</span>
            <Link to={`/app/websites/${issue.siteId}`} className="hover:text-ink">
              {site?.domain}
            </Link>
            <span className="text-ink-faint">/</span>
            <span className="font-mono text-ink">{issue.code}</span>
          </span>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            <SeverityBadge level={issue.severity} />
            {issue.title}
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-surface-muted px-2 py-0.5 font-mono text-[13px] text-ink-soft">
              {issue.path}
            </code>
            {resolved ? (
              <StatusPill tone="healthy">Resolved</StatusPill>
            ) : (
              <StatusPill tone="info" dot={false}>
                Waiting for approval
              </StatusPill>
            )}
          </span>
        }
        actions={
          resolved ? (
            <Link to="/app/issues">
              <Button variant="secondary">Back to issues</Button>
            </Link>
          ) : (
            <>
              <Button variant="ghost" onClick={() => undefined}>
                <X className="size-4" />
                Ignore
              </Button>
              <Button onClick={applyFix} disabled={phase === 'applying'}>
                {phase === 'applying' ? 'Applying fix…' : 'Review & Fix'}
              </Button>
            </>
          )
        }
      />

      {/* Meta strip */}
      <div className="mb-6 grid grid-cols-2 divide-line border-y border-line bg-surface sm:grid-cols-4 sm:divide-x">
        {[
          ['Impact', issue.impact],
          ['Detected', '12 minutes ago'],
          ['Detected by', issue.detectedBy],
          ['Status', resolved ? 'Resolved' : 'Waiting for approval'],
        ].map(([k, v], i) => (
          <div key={k} className="px-4 py-3">
            <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">{k}</p>
            <p className={cn('mt-0.5 text-sm font-medium', i === 3 && !resolved ? 'text-accent' : i === 3 && resolved ? 'text-healthy' : 'text-ink')}>
              {v}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* AI diagnosis */}
          <Panel className="border-l-2 border-l-accent">
            <PanelHeader
              title={
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4 text-accent" />
                  AI diagnosis
                </span>
              }
              action={
                <span className="text-xs text-ink-faint">
                  {issue.detectedBy} · 10:43
                </span>
              }
            />
            <PanelBody>
              <p className="text-sm leading-relaxed text-ink-soft">{issue.diagnosis}</p>
              <dl className="mt-4 divide-y divide-line border-t border-line">
                {issue.evidence.map((e) => (
                  <div key={e.label} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <dt className="font-mono text-[13px] break-all text-ink-muted">{e.label}</dt>
                    <dd className="font-mono text-[13px] font-medium text-critical">{e.value}</dd>
                  </div>
                ))}
              </dl>
            </PanelBody>
          </Panel>

          {/* Recommended fix */}
          <Panel>
            <PanelHeader
              title={
                <span className="flex items-center gap-2">
                  <Wand2 className="size-4 text-accent" />
                  Recommended fix
                </span>
              }
              action={
                <span className="rounded-full bg-accent-tint px-2 py-0.5 text-xs font-semibold text-accent">
                  confidence {issue.confidence}%
                </span>
              }
            />
            <PanelBody>
              <p className="text-sm text-ink-soft">{issue.recommendedFix}</p>
              <div className="mt-2.5 flex items-center justify-between gap-3 rounded-md border border-line bg-canvas px-3.5 py-3">
                <code className="min-w-0 font-mono text-[13px] break-all text-ink">
                  {issue.fixDetail}
                </code>
                <button
                  type="button"
                  onClick={copyFix}
                  className="shrink-0 rounded p-1.5 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
                  aria-label="Copy fix"
                >
                  {copied ? <Check className="size-4 text-healthy" /> : <Copy className="size-4" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                Generated by Fix Agent · preview only until you approve
              </p>
            </PanelBody>
          </Panel>

          {/* Before / after preview */}
          <Panel>
            <PanelHeader
              title="Preview"
              subtitle="Before → after, as it will be applied"
            />
            <PanelBody>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                <div className="rounded-md border border-critical/25 bg-critical-tint p-3.5">
                  <p className="text-[11px] font-semibold tracking-wide text-critical uppercase">
                    Before
                  </p>
                  <p className="mt-1.5 font-mono text-[13px] break-all text-ink">{issue.before.value}</p>
                </div>
                <div className="hidden items-center sm:flex">
                  <ArrowRight className="size-4 text-ink-faint" />
                </div>
                <div className="rounded-md border border-healthy/25 bg-healthy-tint p-3.5">
                  <p className="text-[11px] font-semibold tracking-wide text-healthy uppercase">
                    After
                  </p>
                  <p className="mt-1.5 font-mono text-[13px] break-all text-ink">{issue.after.value}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                {resolved ? (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-healthy">
                    <Check className="size-4" />
                    Fix applied and verified · 10:49
                  </span>
                ) : (
                  <span className="text-[13px] text-ink-muted">
                    Applying requires your approval.
                    {issue.autoFixable && ' This fix is eligible for auto-approval.'}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  {!resolved && (
                    <>
                      <Button variant="ghost">Ignore</Button>
                      <Button onClick={applyFix} disabled={phase === 'applying'}>
                        {phase === 'applying' ? 'Applying…' : 'Review & Fix'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </PanelBody>
          </Panel>

          {/* Resolution timeline */}
          <Panel>
            <PanelHeader
              title="Resolution timeline"
              subtitle="Every step taken by the AI team"
              action={
                <StatusPill tone={resolved ? 'healthy' : 'info'} dot={!resolved}>
                  {resolved ? 'Issue resolved' : 'Awaiting your approval'}
                </StatusPill>
              }
            />
            <PanelBody>
              <ResolutionTimeline steps={steps} />
            </PanelBody>
          </Panel>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Site context" />
            <PanelBody className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Website</span>
                <Link
                  to={`/app/websites/${issue.siteId}`}
                  className="font-medium text-accent hover:underline"
                >
                  {site?.domain}
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Health</span>
                <span className="font-medium text-ink tabular-nums">{site?.health}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Last scan</span>
                <span className="font-medium text-ink">12 min ago</span>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Impact" />
            <PanelBody className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Affected pages</span>
                <span className="font-medium text-ink tabular-nums">{issue.affectedPages}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Visitors affected</span>
                <span className="font-medium text-ink tabular-nums">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">SEO impact</span>
                <span
                  className={cn(
                    'font-medium',
                    issue.seoImpact === 'None' ? 'text-ink' : 'text-warning',
                  )}
                >
                  {issue.seoImpact}
                </span>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Related issues" />
            <ul className="divide-y divide-line">
              {allIssues
                .filter((i) => i.id !== issue.id)
                .slice(0, 3)
                .map((i) => (
                  <li key={i.id}>
                    <Link
                      to={`/app/issues/${i.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-canvas"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">{i.title}</p>
                        <p className="truncate font-mono text-xs text-ink-faint">{i.path}</p>
                      </div>
                      <ArrowRight className="size-3.5 shrink-0 text-ink-faint" />
                    </Link>
                  </li>
                ))}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader
              title={
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-ink-muted" />
                  Automation
                </span>
              }
            />
            <PanelBody>
              <Toggle
                checked={autoApprove}
                onChange={setAutoApprove}
                label="Auto-approve safe fixes"
                description="Fixes with confidence above 95% and no data changes are applied automatically, then verified."
              />
            </PanelBody>
          </Panel>
        </div>
      </div>

      {phase === 'applying' && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 md:bottom-8">
          <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-4 py-2.5 shadow-pop animate-fade-up">
            <span className="size-2 animate-pulse rounded-full bg-accent" />
            <span className="text-sm font-medium text-ink">
              Fix Agent is applying the correction…
            </span>
          </div>
        </div>
      )}
    </>
  )
}
