import { Check, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../../components/app/AppLayout'
import { Button } from '../../components/ui/Button'
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel'
import { StatusPill } from '../../components/ui/Status'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { pricingPlans, workspace } from '../../data/mock'
import { cn } from '../../lib/utils'

const usage = [
  { label: 'Websites', used: 24, max: 100 },
  { label: 'Auto-fixes this month', used: 63, max: 200 },
  { label: 'Scans this month', used: 18420, max: 60000 },
  { label: 'Team seats', used: 4, max: 10 },
]

const invoices = [
  ['INV-2026-010', 'Oct 1, 2026', '$299.00', 'Paid'],
  ['INV-2026-009', 'Sep 1, 2026', '$299.00', 'Paid'],
  ['INV-2026-008', 'Aug 1, 2026', '$299.00', 'Paid'],
  ['INV-2026-007', 'Jul 1, 2026', '$299.00', 'Paid'],
]

export default function BillingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      <PageHeader
        title="Billing"
        subtitle="Subscription, usage and invoices"
        actions={
          <Button variant="secondary">
            <CreditCard className="size-4" />
            Payment method
          </Button>
        }
      />

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Panel>
          <PanelHeader title="Current plan" />
          <PanelBody>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-ink">{workspace.plan}</span>
              <StatusPill tone="healthy">Active</StatusPill>
            </div>
            <p className="mt-1 text-[13px] text-ink-muted">$299 / month · renews Nov 1, 2026</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm">Upgrade plan</Button>
              <Button size="sm" variant="ghost">
                Cancel
              </Button>
            </div>
          </PanelBody>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader title="Usage" subtitle="Resets on Nov 1, 2026" />
          <PanelBody className="grid gap-4 sm:grid-cols-2">
            {usage.map((u) => (
              <div key={u.label}>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="text-ink-muted">{u.label}</span>
                  <span className="font-semibold text-ink tabular-nums">
                    {u.used.toLocaleString('en-US')}
                    <span className="font-normal text-ink-faint"> / {u.max.toLocaleString('en-US')}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      u.used / u.max > 0.8 ? 'bg-warning' : 'bg-accent',
                    )}
                    style={{ width: `${Math.min(100, (u.used / u.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </PanelBody>
        </Panel>
      </div>

      <Panel className="mb-5 overflow-hidden">
        <PanelHeader
          title="Invoices"
          subtitle="Northline Agency · Visa ending 4242"
          action={
            <Button variant="ghost" size="sm">
              Update card
            </Button>
          }
        />
        <div className="hidden sm:block">
          <Table>
            <thead>
              <tr>
                <Th>Invoice</Th>
                <Th>Date</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th className="text-right">PDF</Th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(([id, date, amount, status]) => (
                <Tr key={id}>
                  <Td className="font-mono text-[13px] text-ink">{id}</Td>
                  <Td className="text-ink-muted">{date}</Td>
                  <Td className="font-medium text-ink tabular-nums">{amount}</Td>
                  <Td>
                    <StatusPill tone="healthy">{status}</StatusPill>
                  </Td>
                  <Td className="text-right">
                    <Button variant="ghost" size="sm">Download</Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
        <ul className="divide-y divide-line sm:hidden">
          {invoices.map(([id, date, amount, status]) => (
            <li key={id} className="px-4 py-3.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] text-ink">{id}</span>
                <span className="font-medium text-ink tabular-nums">{amount}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs text-ink-faint">{date}</span>
                <StatusPill tone="healthy">{status}</StatusPill>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Plans */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Plans</h2>
        <div className="flex items-center gap-2 text-[13px]">
          <span className={annual ? 'text-ink-muted' : 'font-medium text-ink'}>Monthly</span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((v) => !v)}
            className={cn(
              'relative h-5 w-9 rounded-full transition-colors',
              annual ? 'bg-accent' : 'bg-line-strong',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform',
                annual && 'translate-x-4',
              )}
            />
          </button>
          <span className={annual ? 'font-medium text-ink' : 'text-ink-muted'}>
            Annual <span className="text-healthy">−20%</span>
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <Panel
            key={plan.id}
            className={cn('flex flex-col', plan.highlighted && 'border-accent shadow-pop')}
          >
            <PanelBody className="flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">{plan.name}</h3>
                {plan.highlighted && (
                  <span className="rounded-full bg-accent-tint px-2 py-0.5 text-[11px] font-semibold text-accent">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink">
                {annual && plan.id !== 'starter' ? (
                  <>
                    ${Math.round(Number(plan.price.slice(1)) * 0.8)}
                    <span className="text-sm font-normal text-ink-faint"> /month</span>
                  </>
                ) : (
                  <>
                    {plan.price}
                    <span className="text-sm font-normal text-ink-faint"> {plan.period}</span>
                  </>
                )}
              </p>
              <p className="mt-1.5 text-[13px] text-ink-muted">{plan.description}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-ink-soft">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-healthy" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <Button
                  variant={plan.highlighted ? 'secondary' : 'primary'}
                  className="w-full"
                  disabled={plan.highlighted}
                >
                  {plan.highlighted ? 'Current plan' : plan.cta}
                </Button>
              </div>
            </PanelBody>
          </Panel>
        ))}
      </div>
    </>
  )
}
