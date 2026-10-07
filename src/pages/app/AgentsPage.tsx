import { Activity, ArrowRight, Check, Radio, Play, Square } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/app/AppLayout'
import { Button } from '../../components/ui/Button'
import { Sparkline } from '../../components/ui/Metric'
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel'
import { StatusPill } from '../../components/ui/Status'
import { api } from '../../lib/api'
import RequireSubscription from '../../components/RequireSubscription'


const icons: Record<string, string> = {
  monitor: '◎',
  performance: '◴',
  seo: '⌕',
  form: '▤',
  security: '◇',
  fix: '⟐',
}

export default function AgentsPage() {
  const totalDetected = agents.reduce((sum, a) => sum + a.detected, 0)
  const totalFixed = agents.reduce((sum, a) => sum + a.fixed, 0)

  return (
    <>
      <PageHeader
        title="AI Agents"
        subtitle="Your AI maintenance team — 6 agents monitoring 24 websites"
        actions={
          <Link to="/app/automations">
            <Button variant="secondary">Configure automations</Button>
          </Link>
        }
      />

      {/* System status strip */}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line bg-surface px-4 py-3">
        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-ink">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-healthy opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-healthy" />
          </span>
          All agents operational
        </span>
        <span className="text-[13px] text-ink-muted">Last full sweep 4 minutes ago</span>
        <span className="text-[13px] text-ink-muted">
          <span className="font-medium text-ink tabular-nums">1,284</span> checks today
        </span>
        <span className="text-[13px] text-ink-muted">
          <span className="font-medium text-ink tabular-nums">{totalDetected}</span> problems detected
        </span>
        <span className="text-[13px] text-ink-muted">
          <span className="font-medium text-ink tabular-nums">{totalFixed}</span> fixes applied
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <article
            key={agent.id}
            className="flex flex-col rounded-lg border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-pop"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md border border-line bg-canvas font-mono text-base text-ink-soft">
                  {icons[agent.id]}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{agent.name}</h3>
                  <p className="text-[11px] text-ink-faint">{agent.scope}</p>
                </div>
              </div>
              <StatusPill tone={agent.status === 'active' ? 'healthy' : 'neutral'}>
                {agent.status === 'active' ? 'Active' : 'Idle'}
              </StatusPill>
            </div>

            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{agent.role}</p>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
              <dl className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <dt className="text-ink-faint">Detected</dt>
                  <dd className="font-semibold text-ink tabular-nums">{agent.detected}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="text-ink-faint">Fixed</dt>
                  <dd className="font-semibold text-healthy tabular-nums">{agent.fixed}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="text-ink-faint">Last analysis</dt>
                  <dd className="font-medium text-ink-muted">{agent.lastAnalysis}</dd>
                </div>
              </dl>
              <Sparkline
                data={agent.activity}
                tone="info"
                width={88}
                height={30}
              />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <Link
                to="/app/activity"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline"
              >
                <Activity className="size-3.5" />
                View logs
              </Link>
              <Link
                to="/app/automations"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-muted hover:text-ink"
              >
                Rules <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Live log */}
      <Panel className="mt-5">
        <PanelHeader
          title={
            <span className="flex items-center gap-2">
              <Radio className="size-4 text-accent" />
              Live agent log
            </span>
          }
          subtitle="Streaming from all agents"
          action={
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-healthy">
              <Check className="size-3.5" />
              Connected
            </span>
          }
        />
        <PanelBody>
          <ul className="space-y-2 font-mono text-[13px]">
            {activity.slice(0, 8).map((event) => (
              <li key={event.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-ink-faint tabular-nums">{event.time}</span>
                <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-ink-soft">
                  {slug(event.agent)}
                </span>
                <span className="text-ink-muted">— {event.message}</span>
              </li>
            ))}
          </ul>
        </PanelBody>
      </Panel>
    </>
  )
}

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

