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
import { useRealtime } from '../../lib/realtime'
import type { Issue } from '../../lib/realtime'

const siteTabs = ['Overview', 'Issues', 'Performance', 'SEO', 'Forms', 'Security', 'Activity']

const tabContent: Record<string, { title: string; description: string }> = {
  Performance: {
    title: 'Core Web Vitals',
    description: 'Measured on every scan · latest response time and payload.',
  },
  SEO: {
    title: 'Technical SEO',
    description: 'Metadata, structure, sitemap and robots.txt checks from the last scan.',
  },
  Forms: {
    title: 'Form monitoring',
    description: 'Forms detected during the scan and their submission configuration.',
  },
  Security: {
    title: 'Security headers',
    description: 'HTTP security headers and exposure checks from the last scan.',
  },
}

export default function WebsiteDetailPage() {
  const { siteId = '' } = useParams()
  const { getSite, siteIssues, issues: allIssues, activity, scanWebsite, refreshing } = useRealtime()
  const site = siteId ? getSite(siteId) : undefined
  const [tab, setTab] = useState('Overview')
  const issues = useMemo(() => (site ? siteIssues(site.id) : []), [site, siteIssues])

  const critical = issues.filter((i) => i.severity === 'critical').length
  const warning = issues.filter((i) => i.severity === 'warning').length
  const optimization = issues.filter((i) => i.severity === 'optimization').length

  if (!site) {
    return (
      <EmptyState
        title="Website not found"
        description="This site may have been removed or you do not have access to it."
      />
    )
  }

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
            <Button onClick={() => scanWebsite(site.id).catch(() => {})} disabled={refreshing}>
              <Play className="size-4" />
              {refreshing ? 'Scanning…' : 'Run scan'}
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
                  Monitor Agent · last scan
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
            <PanelHeader title="Latest resolution" subtitle="Most recently resolved issue" />
            <PanelBody>
              <ResolutionTimeline
                steps={[...allIssues].reverse().find((i) => i.status === 'resolved')?.timeline ?? []}
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
            action={<Button size="sm" onClick={() => scanWebsite(site.id).catch(() => {})} disabled={refreshing}>Run scan</Button>}
          />
          <PanelBody>
            <DimensionContent tab={tab} issues={issues} />
          </PanelBody>
        </Panel>
      )}
    </>
  )
}

function DimensionContent({ tab, issues }: { tab: string; issues: Issue[] }) {
  const cat = (c: string) => issues.filter((i) => i.category === c)
  const perIssue = (c: string): { label: string; value: string; percent: number; tone: 'healthy' | 'warning' | 'critical' }[] => {
    const rows: { label: string; value: string; percent: number; tone: 'healthy' | 'warning' | 'critical' }[] = []
    for (const i of cat(c)) {
      const tone = i.severity === 'critical' ? 'critical' : i.severity === 'warning' ? 'warning' : 'healthy'
      const percent = i.confidence
      rows.push({ label: i.title, value: i.path === '/' ? 'homepage' : i.path, percent, tone })
    }
    if (rows.length === 0) {
      rows.push({ label: c === 'Forms' ? 'Forms checked' : c === 'Security' ? 'Security headers' : c === 'SEO' ? 'Technical SEO' : 'Core Web Vitals', value: 'No open issues', percent: 100, tone: 'healthy' })
    }
    return rows
  }

  const map: Record<string, { label: string; value: string; percent: number; tone: 'healthy' | 'warning' | 'critical' }[]> = {
    Performance: cat('Performance').length
      ? perIssue('Performance')
      : [{ label: 'Response', value: 'within target', percent: 100, tone: 'healthy' }],
    SEO: perIssue('SEO'),
    Forms: perIssue('Forms'),
    Security: perIssue('Security'),
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {map[tab].map((row) => (
        <MetricBar key={row.label} label={row.label} value={row.value} percent={row.percent} tone={row.tone} />
      ))}
    </div>
  )
}
