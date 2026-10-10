import { PageHeader } from '../../components/app/AppLayout'
import { ActivityFeed, TimelineLegend } from '../../components/Timeline'
import { Button } from '../../components/ui/Button'
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel'
import { Tabs } from '../../components/ui/Tabs'
import { useRealtime } from '../../lib/realtime'
import { useState } from 'react'

export default function ActivityPage() {
  const { activity, websites, scanWebsite, refreshing } = useRealtime()
  const [range, setRange] = useState('24h')

  const scanAll = () => {
    for (const w of websites) scanWebsite(w.id).catch(() => {})
  }

  return (
    <>
      <PageHeader
        title="Activity"
        subtitle="Every detection, diagnosis, fix and verification — in order"
        actions={
          <>
            <Button variant="secondary">Export CSV</Button>
            <Button onClick={scanAll} disabled={refreshing}>{refreshing ? 'Scanning…' : 'Run scan'}</Button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          items={[
            { id: '24h', label: 'Last 24h' },
            { id: '7d', label: '7 days' },
            { id: '30d', label: '30 days' },
          ]}
          value={range}
          onChange={setRange}
          className="border-b-0"
        />
        <TimelineLegend />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Agent timeline"
            subtitle="October 7, 2026 · all websites"
            action={<span className="text-xs text-ink-faint">{activity.length} events</span>}
          />
          <PanelBody>
            <ActivityFeed events={activity} />
          </PanelBody>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Today at a glance" />
            <PanelBody className="space-y-3">
              {[
                ['Checks performed', '1,284'],
                ['Problems detected', '4'],
                ['Diagnoses completed', '4'],
                ['Fixes generated', '3'],
                ['Fixes approved', '1'],
                ['Issues resolved', '1'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-line pb-2.5 last:border-0 last:pb-0">
                  <span className="text-[13px] text-ink-muted">{k}</span>
                  <span className="text-sm font-semibold text-ink tabular-nums">{v}</span>
                </div>
              ))}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Most active agents" />
            <PanelBody className="space-y-3">
              {[
                ['Monitor Agent', 68],
                ['Fix Agent', 42],
                ['SEO Agent', 27],
                ['Performance Agent', 18],
              ].map(([name, count]) => (
                <div key={name as string}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink">{name}</span>
                    <span className="font-medium text-ink-muted tabular-nums">{count}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(count as number) * 1.4}%` }}
                    />
                  </div>
                </div>
              ))}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  )
}
