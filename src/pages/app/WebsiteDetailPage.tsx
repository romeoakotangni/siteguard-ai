import { Activity as ActivityIcon, Play, Settings, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/app/AppLayout'
import { IssueChainCard } from '../../components/IssueChainCard'
import { ActivityFeed, ResolutionTimeline } from '../../components/Timeline'
import { Button } from '../../components/ui/Button'
import { HealthGauge, ScoreChip } from '../../components/ui/HealthGauge'
import { MetricBar, Sparkline } from '../../components/ui/Metric'
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel'
import { Tabs } from '../../components/ui/Tabs'
import { StatusPill } from '../../components/ui/Status'
import { EmptyState } from '../../components/ui/Table'
import { activity, getSite, issues as allIssues, siteIssues, siteTabs } from '../../data/mock'

const tabContent: Record<string, { title: string; description: string }> = {
  Performance: {
    title: 'Core Web Vitals',
    description: 'Measured on mobile and desktop, 7-day history.',
  },
  SEO: {
    title: 'Technical SEO',
    description: 'Sitemap, robots.txt, metadata and indexation.',
  },
  Forms: {
    title: 'Form monitoring',
    description: 'End-to-end submission tests across all forms.',
  },
  Security: {
    title: 'Security headers',
    description: 'Basic exposure checks performed every hour.',
  },
}

export default function WebsiteDetailPage() {
  const { siteId = 'acme-studio' } = useParams()
  const site = getSite(siteId) ?? getSite('acme-studio')!
  const [tab, setTab] = useState('Overview')
  const issues = useMemo(() => siteIssues(site.id), [site.id])

  const critical = issues.filter((i) => i.severity === 'critical').length
  const warning = issues.filter((i) => i.severity === 'warning').length
  const optimization = issues.filter((i) => i.severity === 'optimization').length

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link to="/app/websites" className="hover:text-ink">
            Websites
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {site.domain}
            <StatusPill tone={site.status} className="capitalize">
              {site.status === 'healthy' ? 'Healthy' : site.status === 'warning' ? 'Degraded' : 'Critical'} · {site.health}/100
            </StatusPill>
          </span>
        }
        subtitle={`${site.client} · connected ${new Date(site.connectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · uptime ${site.uptime}`}
        actions={
          <>
            <Button variant="secondary">
              <Settings className="size-4" />
              Settings
            </Button>
            <Button>
              <Play className="size-4" />
              Run scan
            </Button>
          </>
        }
      />

      <Tabs
        items={siteTabs.map((t) => ({
          id: t,
          label: t,
          count: t === 'Issues' ? issues.length : undefined,
        }))}
        value={tab}
        onChange={setTab}
        className="mb-6"
      />

      {tab === 'Overview' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <PanelHeader
              title="AI health summary"
              action={
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                  <Sparkles className="size-3.5" />
                  Monitor Agent · 2 min ago
                </span>
              }
            />
            <PanelBody>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <HealthGauge score={site.health} label="Health score" size={190} />
                <div className="flex-1">
                  <p className="text-[15px] leading-relaxed text-ink">
                    {site.status === 'healthy'
                      ? 'Your website is healthy.'
                      : site.status === 'warning'
                        ? 'Your website needs attention.'
                        : 'Your website has critical problems.'}{' '}
                    <span className="text-ink-muted">
                      {issues.length} issues were detected and{' '}
                      {optimization > 0 ? `${optimization} optimizations are` : 'no optimizations are'} recommended.
                    </span>
                  </p>
                  <div className="mt-4 grid grid-cols-3 divide-x divide-line border-y border-line">
                    {[
                      { label: 'Critical', value: critical, tone: 'text-critical' },
                      { label: 'Warning', value: warning, tone: 'text-warning' },
                      { label: 'Optimization', value: optimization, tone: 'text-info' },
                    ].map((s) => (
                      <div key={s.label} className="py-3 pr-3 pl-0 first:pl-0 sm:px-4">
                        <p className={`text-xl font-semibold tabular-nums ${s.tone}`}>{s.value}</p>
                        <p className="text-xs text-ink-muted">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setTab('Issues')}>
                      Review issues
                    </Button>
                    <Link
                      to="/app/activity"
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-ink-soft hover:bg-surface-muted hover:text-ink"
                    >
                      <ActivityIcon className="size-4" />
                      Agent timeline
                    </Link>
                  </div>
                </div>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Site context" />
            <PanelBody className="space-y-4">
              <dl className="space-y-3 text-sm">
                {[
                  ['Response time', `${site.responseMs} ms`],
                  ['Uptime (30d)', site.uptime],
                  ['Plan', site.plan],
                  ['Last full scan', 'Today, 10:42'],
                  ['Monitoring', 'Every 60 seconds'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="font-medium text-ink tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-line pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-ink">Health · 14 days</span>
                  <ScoreChip score={site.health} />
                </div>
                <Sparkline
                  data={[88, 89, 91, 90, 92, 93, 92, 94, 93, 95, 94, 94, 95, site.health]}
                  tone={site.status === 'critical' ? 'critical' : 'healthy'}
                  width={240}
                  height={36}
                />
              </div>
            </PanelBody>
          </Panel>

          <Panel className="lg:col-span-2">
            <PanelHeader
              title="Detected issues"
              subtitle="Each one comes with an AI diagnosis and a proposed fix"
              action={
                <button type="button" onClick={() => setTab('Issues')} className="text-[13px] font-medium text-accent hover:underline">
                  View all
                </button>
              }
            />
            <div className="space-y-4 p-5">
              {issues.slice(0, 2).map((issue) => (
                <IssueChainCard key={issue.id} issue={issue} compact showChain={false} />
              ))}
              {issues.length === 0 && (
                <EmptyState
                  title="No issues detected"
                  description="AI agents continuously watch this site. Nothing needs your attention."
                />
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Monitoring dimensions" />
            <PanelBody className="space-y-3.5">
              <MetricBar label="Availability" value={site.uptime} percent={99} tone="healthy" />
              <MetricBar label="Performance" value="91" percent={91} tone="healthy" />
              <MetricBar label="Security" value="96" percent={96} tone="healthy" />
              <MetricBar label="SEO" value="89" percent={89} tone="warning" />
              <MetricBar label="Forms" value="100" percent={100} tone="healthy" />
            </PanelBody>
          </Panel>
        </div>
      )}

      {tab === 'Issues' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="critical" dot={false}>
              Critical {critical}
            </StatusPill>
            <StatusPill tone="warning" dot={false}>
              Warning {warning}
            </StatusPill>
            <StatusPill tone="info" dot={false}>
              Optimization {optimization}
            </StatusPill>
          </div>
          {issues.map((issue) => (
            <IssueChainCard key={issue.id} issue={issue} siteDomain={site.domain} />
          ))}
          {issues.length === 0 && (
            <EmptyState
              title="No issues detected"
              description="AI agents continuously watch this site. Nothing needs your attention."
            />
          )}
        </div>
      )}

      {tab === 'Activity' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Agent activity" subtitle="Last 24 hours" />
            <PanelBody>
              <ActivityFeed events={activity} />
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Latest resolution" subtitle="Issue #1042 · broken link" />
            <PanelBody>
              <ResolutionTimeline
                steps={
                  allIssues.find((i) => i.id === '1042')?.timeline ?? []
                }
              />
            </PanelBody>
          </Panel>
        </div>
      )}

      {Object.keys(tabContent).includes(tab) && (
        <Panel>
          <PanelHeader
            title={tabContent[tab].title}
            subtitle={tabContent[tab].description}
            action={<Button size="sm">Run scan</Button>}
          />
          <PanelBody>
            <DimensionContent tab={tab} />
          </PanelBody>
        </Panel>
      )}
    </>
  )
}

function DimensionContent({ tab }: { tab: string }) {
  const map: Record<string, { label: string; value: string; percent: number; tone: 'healthy' | 'warning' | 'critical' }[]> = {
    Performance: [
      { label: 'LCP · Largest Contentful Paint', value: '2.1 s', percent: 84, tone: 'healthy' },
      { label: 'INP · Interaction to Next Paint', value: '120 ms', percent: 92, tone: 'healthy' },
      { label: 'CLS · Cumulative Layout Shift', value: '0.04', percent: 96, tone: 'healthy' },
      { label: 'TTFB · Time to First Byte', value: '310 ms', percent: 78, tone: 'warning' },
    ],
    SEO: [
      { label: 'Indexability', value: '100%', percent: 100, tone: 'healthy' },
      { label: 'Sitemap validity', value: '63/63 URLs', percent: 100, tone: 'healthy' },
      { label: 'robots.txt', value: 'Valid', percent: 100, tone: 'healthy' },
      { label: 'Metadata coverage', value: '89%', percent: 89, tone: 'warning' },
    ],
    Forms: [
      { label: 'Contact form', value: 'Passing', percent: 100, tone: 'healthy' },
      { label: 'Newsletter signup', value: 'Passing', percent: 100, tone: 'healthy' },
      { label: 'Quote request', value: 'Passing', percent: 100, tone: 'healthy' },
      { label: 'Last test run', value: '18 min ago', percent: 100, tone: 'healthy' },
    ],
    Security: [
      { label: 'HTTPS & certificate', value: 'Valid · 74 days', percent: 100, tone: 'healthy' },
      { label: 'Security headers', value: '4 of 5', percent: 80, tone: 'warning' },
      { label: 'Mixed content', value: 'None', percent: 100, tone: 'healthy' },
      { label: 'Exposed assets', value: 'None', percent: 100, tone: 'healthy' },
    ],
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {map[tab].map((row) => (
        <MetricBar key={row.label} label={row.label} value={row.value} percent={row.percent} tone={row.tone} />
      ))}
    </div>
  )
}
