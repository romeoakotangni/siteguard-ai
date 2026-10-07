import { Check } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/app/AppLayout'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel'
import { StatusPill } from '../../components/ui/Status'
import { Tabs, Toggle } from '../../components/ui/Tabs'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { workspace } from '../../data/mock'

const tabs = ['General', 'Monitoring', 'Notifications', 'Team', 'Integrations']

const members = [
  { name: 'Marie Dupont', email: 'marie@northline.agency', role: 'Owner', status: 'Active' },
  { name: 'Thomas Rey', email: 'thomas@northline.agency', role: 'Admin', status: 'Active' },
  { name: 'Sofia Marchetti', email: 'sofia@northline.agency', role: 'Editor', status: 'Active' },
  { name: 'client@acme.com', email: 'client@acme.com', role: 'Viewer', status: 'Invited' },
]

const integrations = [
  ['Slack', 'Alerts and approvals in #site-health', 'Connected'],
  ['GitHub', 'Auto-verify fixes after each deploy', 'Connected'],
  ['Webhooks', 'Send events to your own endpoint', 'Connected'],
  ['Google Search Console', 'Enrich SEO diagnostics', 'Not connected'],
  ['Zapier', 'Trigger 5,000+ apps', 'Not connected'],
]

export default function SettingsPage() {
  const [tab, setTab] = useState('General')

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle={`${workspace.name} · ${workspace.plan} plan`}
        actions={<Button>Save changes</Button>}
      />

      <Tabs items={tabs.map((t) => ({ id: t, label: t }))} value={tab} onChange={setTab} className="mb-6" />

      {tab === 'General' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Workspace" />
            <PanelBody className="space-y-4">
              <Field label="Workspace name">
                <Input defaultValue={workspace.name} />
              </Field>
              <Field label="Workspace URL" hint="Used for client-facing report links.">
                <Input defaultValue="app.siteguard.ai/northline" />
              </Field>
              <Field label="Default timezone">
                <Input defaultValue="Europe/Paris (UTC+2)" />
              </Field>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Profile" />
            <PanelBody className="space-y-4">
              <Field label="Full name">
                <Input defaultValue={workspace.user.name} />
              </Field>
              <Field label="Email">
                <Input defaultValue={workspace.user.email} />
              </Field>
              <Field label="Role">
                <Input defaultValue={workspace.user.role} readOnly />
              </Field>
            </PanelBody>
          </Panel>

          <Panel className="lg:col-span-2">
            <PanelHeader title="Danger zone" />
            <PanelBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Disconnect all websites</p>
                <p className="text-[13px] text-ink-muted">
                  Monitoring stops immediately. History is kept for 30 days.
                </p>
              </div>
              <Button variant="danger">Disconnect all</Button>
            </PanelBody>
          </Panel>
        </div>
      )}

      {tab === 'Monitoring' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Scan frequency" subtitle="Applies to all sites unless overridden" />
            <PanelBody>
              <div className="space-y-1">
                {[
                  ['Minute-level', 'Every 60 seconds · Agency plan', true],
                  ['Hourly', 'Every 60 minutes · Pro plan', false],
                  ['Daily', 'Once per day · Starter plan', false],
                ].map(([label, hint, active]) => (
                  <label
                    key={label as string}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-line px-3.5 py-3 transition-colors hover:border-line-strong has-[:checked]:border-accent has-[:checked]:bg-accent-tint-soft"
                  >
                    <input
                      type="radio"
                      name="frequency"
                      defaultChecked={active as boolean}
                      className="mt-1 accent-[#1f5eff]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-ink">{label}</span>
                      <span className="block text-[13px] text-ink-muted">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Checks" subtitle="What agents run on every scan" />
            <PanelBody className="divide-y divide-line">
              <Toggle checked onChange={() => undefined} label="Availability & HTTP errors" description="Uptime, 4xx/5xx and response time." />
              <Toggle checked onChange={() => undefined} label="Core Web Vitals" description="LCP, INP and CLS on mobile + desktop." />
              <Toggle checked onChange={() => undefined} label="Forms" description="End-to-end submission tests." />
              <Toggle checked onChange={() => undefined} label="SEO technical" description="Sitemap, robots.txt, metadata." />
              <Toggle checked={false} onChange={() => undefined} label="Visual regression" description="Screenshot diff after each deploy." />
              <Toggle checked={false} onChange={() => undefined} label="Content changes" description="Alert on unusual edits." />
            </PanelBody>
          </Panel>
        </div>
      )}

      {tab === 'Notifications' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Channels" />
            <PanelBody className="divide-y divide-line">
              <Toggle checked onChange={() => undefined} label="Email" description="marie@northline.agency" />
              <Toggle checked onChange={() => undefined} label="Slack" description="#site-health channel" />
              <Toggle checked={false} onChange={() => undefined} label="Webhook" description="POST events to your endpoint" />
              <Toggle checked={false} onChange={() => undefined} label="SMS" description="Critical downtime only" />
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="What to notify" />
            <PanelBody className="divide-y divide-line">
              <Toggle checked onChange={() => undefined} label="Critical issues" description="Downtime, data loss, form failures." />
              <Toggle checked onChange={() => undefined} label="Fix waiting for approval" description="When the Fix Agent needs you." />
              <Toggle checked onChange={() => undefined} label="Fixes resolved automatically" description="Confirmation after auto-fix." />
              <Toggle checked={false} onChange={() => undefined} label="Optimization suggestions" description="Low-priority improvements." />
              <Toggle checked onChange={() => undefined} label="Weekly summary" description="Every Monday morning." />
            </PanelBody>
          </Panel>
        </div>
      )}

      {tab === 'Team' && (
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Members"
            subtitle="Roles control who can approve and apply fixes"
            action={<Button size="sm">Invite member</Button>}
          />
          <div className="hidden sm:block">
            <Table>
              <thead>
                <tr>
                  <Th>Member</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <Tr key={m.email}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 items-center justify-center rounded-full bg-accent-tint text-[11px] font-semibold text-accent-hover">
                          {m.name.split(' ').map((p) => p[0]).join('')}
                        </span>
                        <div>
                          <p className="font-medium text-ink">{m.name}</p>
                          <p className="text-xs text-ink-faint">{m.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-ink-muted">{m.role}</Td>
                    <Td>
                      <StatusPill tone={m.status === 'Active' ? 'healthy' : 'info'}>{m.status}</StatusPill>
                    </Td>
                    <Td className="text-right">
                      <Button variant="ghost" size="sm">Manage</Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
          <ul className="divide-y divide-line sm:hidden">
            {members.map((m) => (
              <li key={m.email} className="px-4 py-3.5">
                <p className="text-sm font-medium text-ink">{m.name}</p>
                <p className="text-xs text-ink-faint">{m.email}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-ink-muted">{m.role}</span>
                  <StatusPill tone={m.status === 'Active' ? 'healthy' : 'info'}>{m.status}</StatusPill>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {tab === 'Integrations' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {integrations.map(([name, desc, status]) => (
            <Panel key={name}>
              <PanelBody className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{name}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{desc}</p>
                </div>
                {status === 'Connected' ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-healthy-tint px-2 py-0.5 text-xs font-medium text-healthy">
                    <Check className="size-3" />
                    Connected
                  </span>
                ) : (
                  <Button variant="secondary" size="sm">Connect</Button>
                )}
              </PanelBody>
            </Panel>
          ))}
          <div className="sm:col-span-2">
            <Link to="/app/billing" className="text-sm font-medium text-accent hover:underline">
              Looking for subscriptions and invoices? Go to Billing →
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
