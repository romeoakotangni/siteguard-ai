import { ArrowRight, Globe, Plus, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/app/AppLayout'
import { ActivityFeed } from '../../components/Timeline'
import { HealthGauge } from '../../components/ui/HealthGauge'
import { MetricBar } from '../../components/ui/Metric'
import { Button } from '../../components/ui/Button'
import { CountUp } from '../../components/motion/Reveal'
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel'
import { StatusDot, StatusPill } from '../../components/ui/Status'
import { ScoreChip } from '../../components/ui/HealthGauge'
import { Table, Td, Th, Tr, EmptyState } from '../../components/ui/Table'
import { useRealtime } from '../../lib/realtime'
import { formatRelativeTime } from '../../lib/utils'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { overview, websites, issues, approvals, activity, agents, scanWebsite, refreshing } = useRealtime()

  const stats = [
    { label: 'Websites', value: overview.websites, tone: 'neutral' as const },
    { label: 'Healthy', value: overview.healthy, tone: 'healthy' as const },
    { label: 'Issues', value: overview.issues, tone: 'warning' as const },
    { label: 'Actions waiting for approval', value: overview.approvals, tone: 'info' as const },
  ]

  const scanAll = () => {
    for (const w of websites) scanWebsite(w.id).catch(() => {})
  }

  if (overview.websites === 0) {
    return <EmptyDashboard />
  }
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${agents.length} agents active · ${overview.healthScore}/100 global health`}
        actions={
          <>
            <Button variant="secondary" onClick={scanAll} disabled={refreshing}>
              {refreshing ? 'Scanning…' : 'Run scan'}
            </Button>
            <Link
              to="/onboarding"
              className="inline-flex h-9.5 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus className="size-4" />
              Connecter mon premier site
            </Link>
          </>
        }
      />

      {/* Overview strip — hairline separated, no decorative cards */}
      <div className="mb-6 grid grid-cols-2 divide-line border-y border-line bg-surface md:grid-cols-4 md:divide-x">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-4 md:px-5">
            <div className="flex items-center gap-2">
              <StatusDot tone={stat.tone === 'neutral' ? 'neutral' : stat.tone} />
              <span className="text-[13px] text-ink-muted">{stat.label}</span>
            </div>
            <p className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-ink tabular-nums">
              <CountUp to={stat.value} duration={1100} />
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Health overview */}
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Health overview"
            subtitle="Aggregated across all connected websites"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-healthy-tint px-2 py-0.5 text-xs font-medium text-healthy">
                <span className="size-1.5 rounded-full bg-healthy" />
                {overview.trend}
              </span>
            }
          />
          <PanelBody className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex justify-center sm:justify-start">
              <HealthGauge score={overview.healthScore} />
            </div>
            <div className="space-y-3.5">
              {overview.metrics.map((m) => (
                <MetricBar
                  key={m.label}
                  label={m.label}
                  value={m.value}
                  percent={m.percent}
                  tone={m.tone}
                  hint={m.hint}
                />
              ))}
            </div>
          </PanelBody>
        </Panel>

        {/* Right column */}
        <div className="space-y-5">
          <Panel>
            <PanelHeader
              title="Waiting for approval"
              subtitle="AI prepared these fixes"
              action={
                <Link to="/app/issues" className="text-xs font-medium text-accent hover:underline">
                  All issues
                </Link>
              }
            />
            <div className="divide-y divide-line">
              {approvals.slice(0, 3).map((issue) => {
                const site = websites.find((w) => w.id === issue.siteId)
                return (
                  <Link
                    key={issue.id}
                    to={`/app/issues/${issue.id}`}
                    className="block px-5 py-3.5 transition-colors hover:bg-canvas"
                  >
                    <div className="flex items-start gap-2.5">
                      <StatusDot
                        tone={issue.severity === 'critical' ? 'critical' : 'warning'}
                        className="mt-1.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{issue.title}</p>
                        <p className="mt-0.5 truncate font-mono text-xs text-ink-muted">
                          {issue.path}
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                          {issue.diagnosis.split('. ')[0]}.
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex h-7 items-center rounded-md bg-accent px-2.5 text-xs font-medium text-white">
                            Review &amp; Fix
                          </span>
                          <span className="text-[11px] text-ink-faint">{site?.domain}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Recent agent activity"
              action={
                <Link to="/app/activity" className="text-xs font-medium text-accent hover:underline">
                  Timeline
                </Link>
              }
            />
            <PanelBody className="pt-1 pb-4">
              <ActivityFeed events={activity.slice(0, 5)} showSite={false} />
            </PanelBody>
          </Panel>
        </div>
      </div>

      {/* Websites table */}
      <Panel className="mt-5">
<PanelHeader
          title="Your websites"
          subtitle={`${overview.websites} sites monitored · ${overview.healthy} healthy`}
          action={
            <Link
              to="/app/websites"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        <div className="hidden md:block">
          <Table>
            <thead>
              <tr>
                <Th>Website</Th>
                <Th>Health</Th>
                <Th>Status</Th>
                <Th>Issues</Th>
                <Th>Response</Th>
                <Th>Last scan</Th>
                <Th className="text-right">Agent</Th>
              </tr>
            </thead>
            <tbody>
              {websites.slice(0, 6).map((site) => (
                <Tr key={site.id} onClick={() => navigate(`/app/websites/${site.id}`)}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-md border border-line bg-canvas text-[11px] font-semibold text-ink-muted">
                        {site.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium text-ink">{site.domain}</p>
                        <p className="text-xs text-ink-faint">{site.client}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <ScoreChip score={site.health} />
                  </Td>
                  <Td>
                    <StatusPill
                      tone={site.status}
                      className="capitalize"
                    >
                      {site.status === 'healthy' ? 'Healthy' : site.status === 'warning' ? 'Degraded' : 'Critical'}
                    </StatusPill>
                  </Td>
                  <Td className="text-ink-muted tabular-nums">
                    {site.issues.critical + site.issues.warning + site.issues.optimization}
                  </Td>
                  <Td className="text-ink-muted tabular-nums">{site.responseMs} ms</Td>
                  <Td className="text-ink-muted">{formatRelativeTime(site.lastScan)}</Td>
<Td className="text-right">
                    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                      <Sparkles className="size-3.5 text-accent" />
                      {agents.length} active
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Mobile: table becomes a list */}
        <ul className="divide-y divide-line md:hidden">
          {websites.slice(0, 6).map((site) => (
            <li key={site.id}>
              <Link to={`/app/websites/${site.id}`} className="block px-4 py-3.5 hover:bg-canvas">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{site.domain}</p>
                    <p className="text-xs text-ink-faint">{site.client}</p>
                  </div>
                  <ScoreChip score={site.health} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <StatusPill tone={site.status}>
                    {site.status === 'healthy' ? 'Healthy' : site.status === 'warning' ? 'Degraded' : 'Critical'}
                  </StatusPill>
                  <span className="text-xs text-ink-faint">
                    {site.issues.critical + site.issues.warning + site.issues.optimization} issues ·{' '}
                    {formatRelativeTime(site.lastScan)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      {issues.length === 0 && (
        <p className="mt-4 text-center text-sm text-ink-muted">No issues detected.</p>
      )}
    </>
  )
}

/** Shown before the first site is connected — the primary CTA must be obvious. */
function EmptyDashboard() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="No websites connected yet" />
      <EmptyState
        icon={<Globe className="size-7" />}
        title="Connect your first website to start monitoring"
        description="AI agents will scan availability, performance, SEO, forms and security within 2 minutes, then diagnose every problem they find and propose fixes."
        action={
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link to="/onboarding">
              <Button>
                <Plus className="size-4" />
                Connecter mon premier site
              </Button>
            </Link>
            <Button variant="secondary">Voir une d—mo</Button>
          </div>
        }
        className="py-20"
      />
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-ink-faint">
        <span>Monitoring 24/7</span>
        <span>AI diagnostics</span>
        <span>Automated fixes</span>
        <span>Multi-site</span>
      </div>
    </>
  )
}
