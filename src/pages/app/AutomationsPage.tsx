import { Plus, Zap } from 'lucide-react'
import { PageHeader } from '../../components/app/AppLayout'
import { Button } from '../../components/ui/Button'
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel'
import { StatusPill } from '../../components/ui/Status'
import { Toggle } from '../../components/ui/Tabs'
import { useRealtime } from '../../lib/realtime'

const triggerLabel: Record<string, string> = {
  monitor_404: 'Monitor Agent detects an internal 404',
  deploy_webhook: 'Deployment webhook received',
  performance_lcp: 'Performance Agent detects an LCP regression from an image',
  weekly: 'Every Monday, 08:00',
}

const actionLabel: Record<string, string> = {
  update_link: 'Update link target to the replacement URL, then verify',
  full_scan: 'Run full scan, compare snapshots, open issues on regression',
  webp: 'Convert to WebP with responsive srcset',
  report_email: 'Generate and email a white-label health report',
}

export default function AutomationsPage() {
  const { automations, toggleAutomation } = useRealtime()

  const rules = automations.map((r: any) => ({
    id: r.id,
    name: r.name,
    trigger: triggerLabel[r.trigger] || r.trigger || '',
    action: actionLabel[r.action?.kind] || r.action?.kind || '',
    scope: String(r.name).includes('image') ? 'Pro and Agency sites' : 'All websites',
    enabled: Boolean(r.enabled),
    runs: 0,
  }))

  const toggle = (id: string, value: boolean) =>
    toggleAutomation(id, value).catch(() => {})

  return (
    <>
      <PageHeader
        title="Automations"
        subtitle="Let approved AI fixes run without waiting — you stay in control"
        actions={
          <Button>
            <Plus className="size-4" />
            New automation
          </Button>
        }
      />

      <div className="mb-5 flex items-start gap-3 rounded-lg border border-accent/20 bg-accent-tint-soft px-4 py-3.5">
        <Zap className="mt-0.5 size-4 shrink-0 text-accent" />
        <p className="text-[13px] leading-relaxed text-ink-soft">
          <span className="font-semibold text-ink">How automations work.</span> Each rule only fires
          when the matching agent detects a problem. The Fix Agent prepares a correction, your rule
          decides whether it runs automatically or waits for approval, and Monitor Agent verifies the
          result before an issue is marked resolved.
        </p>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <Panel key={rule.id}>
            <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-sm font-semibold text-ink">{rule.name}</h3>
                  <StatusPill tone={rule.enabled ? 'healthy' : 'neutral'}>
                    {rule.enabled ? 'Enabled' : 'Paused'}
                  </StatusPill>
                </div>
                <dl className="mt-2.5 grid gap-1.5 text-[13px] sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-ink-faint">When</dt>
                    <dd className="text-ink-soft">{rule.trigger}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-ink-faint">Then</dt>
                    <dd className="text-ink-soft">{rule.action}</dd>
                  </div>
                </dl>
              </div>

              <div className="flex items-center justify-between gap-6 border-t border-line pt-4 lg:justify-end lg:border-t-0 lg:pt-0">
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink tabular-nums">{rule.runs}</p>
                  <p className="text-[11px] text-ink-faint">runs</p>
                </div>
                <div className="w-44">
                  <p className="mb-1 truncate text-xs text-ink-muted">{rule.scope}</p>
                  <Toggle
                    checked={rule.enabled}
                    onChange={(v) => toggle(rule.id, v)}
                    label=""
                    description=""
                  />
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="mt-6">
        <PanelHeader title="Approval policy" subtitle="Applied to every automation" />
        <PanelBody className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <Toggle
            checked
            onChange={() => undefined}
            label="Require approval below 95% confidence"
            description="Low-confidence fixes always wait for a human."
          />
          <Toggle
            checked
            onChange={() => undefined}
            label="Never touch forms or checkout"
            description="Revenue-critical flows are excluded from auto-fix."
          />
          <Toggle
            checked={false}
            onChange={() => undefined}
            label="Allow automatic plugin rollbacks"
            description="Requires owner permission."
          />
          <Toggle
            checked
            onChange={() => undefined}
            label="Verify every fix after applying"
            description="Monitor Agent re-tests before closing an issue."
          />
        </PanelBody>
      </Panel>
    </>
  )
}
