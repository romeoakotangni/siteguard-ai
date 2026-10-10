import { Check, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../../components/app/AppLayout'
import { Button } from '../../components/ui/Button'
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel'
import { StatusPill } from '../../components/ui/Status'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { api } from '../../lib/api'
import { useRealtime } from '../../lib/realtime'
import { cn } from '../../lib/utils'

export default function BillingPage() {
  const { pricingPlans, workspace, subscription, payments, usage } = useRealtime()
  const [annual, setAnnual] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const usageRows = usage
    ? [
        { label: 'Websites', used: usage.websites, max: Math.max(usage.websitesMax, usage.websites, 1) },
        { label: 'Auto-fixes this month', used: usage.resolved, max: Math.max(100, usage.resolved, 1) },
        { label: 'Scans this month', used: usage.scans, max: Math.max(60000, usage.scans, 1) },
        { label: 'Open issues', used: usage.openIssues, max: Math.max(50, usage.openIssues, 1) },
      ]
    : []

  const invoiceRows = payments
    .filter((p) => p && p.status === 'success')
    .slice(0, 6)
    .map((p: any) => [
      p.reference || p.transaction_id || p.id,
      new Date(p.paid_at || p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      `${Number(p.amount_cfa || 0).toLocaleString('fr-FR')} CFA`,
      'Paid',
    ])

  function choosePlan(plan: (typeof pricingPlans)[number]) {
    if (plan.highlighted) return
    setBusy(plan.id)
    api.checkout
      .kkiapay({ plan_code: plan.id, amount_cfa: plan.priceCfa })
      .then((c: any) => {
        if (!c || !c.publicKey) {
          alert('Paiement Mobile Money : la clé KKiaPay doit encore être configurée côté serveur. La demande a été enregistrée, contactez le support pour activer votre plan.')
          return
        }
        const win = window as any
        const load = () =>
          win.openKkiapayWidget({
            amount: Number(c.amount ?? c.amount_cfa ?? plan.priceCfa),
            key: c.publicKey,
            sandbox: c.sandbox === true,
            theme: '#1F5EFF',
            callback: (r: any) => {
              if (r && r.transactionId) window.location.href = c.callback
            },
          })
        if (win.openKkiapayWidget) load()
        else {
          const s = document.createElement('script')
          s.src = 'https://cdn.kkiapay.me/kkiapay.min.js'
          s.onload = load
          document.head.appendChild(s)
        }
      })
      .catch((e: any) => alert(e?.message || 'Erreur paiement'))
      .finally(() => setBusy(null))
  }

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

      {subscription?.status === 'trial' && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-accent/25 bg-accent-tint px-4 py-3 text-[13px] text-ink">
          <span className="font-semibold text-accent">Essai Pro en cours</span>
          <span className="text-ink-muted">
            {subscription.trialEndsAt
              ? `Se termine le ${new Date(subscription.trialEndsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}. `
              : ''}
            Après l'essai, vous repassez au plan Starter gratuit (1 site, 1 scan/jour).
          </span>
          <span className="ml-auto">
            <Button size="sm" onClick={() => choosePlan(pricingPlans.find((p) => !p.highlighted && p.priceCfa > 0) ?? pricingPlans[pricingPlans.length - 1])} disabled={busy !== null}>
              {busy ? 'Paiement…' : 'Sécuriser dès maintenant'}
            </Button>
          </span>
        </div>
      )}

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Panel>
          <PanelHeader title="Current plan" />
          <PanelBody>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-ink">{workspace.plan}</span>
              <StatusPill tone={subscription?.status === 'active' ? 'healthy' : 'info'}>
                {subscription?.status === 'active' ? 'Active' : subscription?.status || 'Trialing'}
              </StatusPill>
            </div>
            <p className="mt-1 text-[13px] text-ink-muted">
              {subscription?.priceCfa ? `${Number(subscription.priceCfa).toLocaleString('fr-FR')} CFA / month` : 'Free plan'}
              {subscription?.periodEnd ? ` · renews ${new Date(subscription.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => choosePlan(pricingPlans.find((p) => !p.highlighted && p.priceCfa > 0) ?? pricingPlans[pricingPlans.length - 1])} disabled={busy !== null}>
                {busy ? 'Paiement…' : 'Upgrade plan'}
              </Button>
            </div>
          </PanelBody>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader title="Usage" subtitle="This month" />
          <PanelBody className="grid gap-4 sm:grid-cols-2">
            {usageRows.map((u) => (
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
          subtitle={`${workspace.name} · Mobile Money (KKiaPay)`}
          action={
            <Button variant="ghost" size="sm">
              Update card
            </Button>
          }
        />
        {invoiceRows.length > 0 ? (
          <>
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
                  {invoiceRows.map(([id, date, amount, status]) => (
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
              {invoiceRows.map(([id, date, amount, status]) => (
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
          </>
        ) : (
          <p className="px-5 py-6 text-sm text-ink-muted">No payments yet — invoices appear here once a subscription is paid via Mobile Money.</p>
        )}
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
                <span className="whitespace-nowrap">
                  {(annual && plan.id !== 'starter' ? Math.round(plan.priceCfa * 0.8) : plan.priceCfa).toLocaleString('fr-FR')}
                  <span className="text-sm font-normal text-ink-faint"> CFA /month</span>
                </span>
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
                  disabled={plan.highlighted || busy !== null}
                  onClick={() => choosePlan(plan)}
                >
                  {busy === plan.id ? 'Paiement en cours…' : plan.highlighted ? 'Current plan' : plan.cta}
                </Button>
              </div>
            </PanelBody>
          </Panel>
        ))}
      </div>
    </>
  )
}
