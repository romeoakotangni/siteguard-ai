import { ArrowRight, Check, Mail, Terminal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { agents, pricingPlans } from '../../data/mock'
import { CountUp, Reveal } from '../motion/Reveal'
import { Tilt } from '../motion/Tilt'
import { Logo } from '../Logo'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/Status'
import { Sparkline } from '../ui/Metric'
import { cn } from '../../lib/utils'

const agentGlyphs: Record<string, string> = {
  monitor: '◎',
  performance: '◴',
  seo: '⌕',
  form: '▤',
  security: '◇',
  fix: '⟐',
}

const agentStats: Record<string, [string, string]> = {
  monitor: ['2,410 checks/day', '0 false positives'],
  performance: ['180 audits/day', 'p95 1.4s LCP'],
  seo: ['960 crawls/day', '89 issues caught'],
  form: ['340 submits/day', '0 leaks'],
  security: ['1,100 scans/day', '0 breaches'],
  fix: ['64 PRs opened', '98% merged'],
}

export function AgentsSection() {
  return (
    <section id="agents" className="border-b border-line bg-surface py-12 sm:py-16 md:py-20">
      <div className="container-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
              Autonomous fleet
            </p>
            <h2 className="mt-3 text-[24px] leading-[1.12] font-semibold tracking-[-0.03em] text-ink sm:text-[30px] md:text-4xl">
              Your AI maintenance team.
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-muted sm:mt-4 sm:text-[15px] md:text-base">
              Six specialists, one job each. They behave like software infrastructure — status,
              logs, results — not a chatbot.
            </p>
          </div>
          <Link to="/app/agents" className="shrink-0">
            <Button variant="secondary">
              Open agents
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent, i) => (
            <Reveal key={agent.id} delay={(i % 3) * 90}>
              <Tilt max={6} className="h-full">
              <article className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition-shadow duration-300 hover:shadow-pop">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-[4px] border border-line bg-canvas font-mono text-base text-ink-soft">
                      {agentGlyphs[agent.id]}
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

                <p className="mt-3 flex-1 text-[13px] leading-relaxed text-ink-muted">{agent.role}</p>

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
                  <dl className="space-y-1 text-xs">
                    {(agentStats[agent.id] ?? ['—', '—']).map((stat, idx) => (
                      <div key={stat} className="flex gap-2">
                        <dt className="text-ink-faint">{idx === 0 ? 'Throughput' : 'Quality'}</dt>
                        <dd
                          className={cn(
                            'font-semibold tabular-nums',
                            idx === 0 ? 'text-ink' : 'text-healthy',
                          )}
                        >
                          {stat}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="text-right">
                    <Sparkline data={agent.activity} tone="info" width={80} height={26} />
                    <p className="mt-1 text-[11px] text-ink-faint">{agent.lastAnalysis}</p>
                  </div>
                </div>
              </article>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function PricingSection() {
  return (
    <section id="pricing" className="border-b border-line bg-canvas py-12 sm:py-16 md:py-20">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
            Transparent value
          </p>
          <h2 className="mt-3 text-[24px] leading-[1.12] font-semibold tracking-[-0.03em] text-ink sm:text-[30px] md:text-4xl">
            Predictable pricing for resilient websites.
          </h2>
          <p className="mt-4 text-[15px] text-ink-muted sm:text-base">
            Every plan includes all six agents, unlimited issues and AI diagnosis.
          </p>
        </div>

        <div className="mx-auto mt-9 grid max-w-5xl gap-4 md:grid-cols-3">
          {pricingPlans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 90}>
              <Tilt max={5} className="h-full">
              <div
                className={cn(
                  'flex h-full flex-col rounded-xl border bg-surface p-6 transition-shadow duration-300',
                  plan.highlighted
                    ? 'border-accent shadow-[0_8px_24px_-12px_rgb(31_94_255/0.35)]'
                    : 'border-line hover:shadow-pop',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">{plan.name}</h3>
                  {plan.highlighted && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white uppercase">
                      Most popular
                    </span>
                  )}
                </div>

                <p className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-ink tabular-nums">
                  {plan.price}
                  <span className="text-sm font-normal text-ink-faint"> {plan.period}</span>
                </p>
                <p className="mt-1.5 text-[13px] text-ink-muted">{plan.description}</p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] text-ink-soft">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-healthy" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/onboarding" className="mt-6">
                  <Button
                    variant={plan.highlighted ? 'primary' : 'secondary'}
                    className="w-full active:scale-[0.98]"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
              </Tilt>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-center text-[13px] text-ink-faint">
          All plans: AI diagnosis, approval workflow, weekly reports · Cancel anytime
        </p>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section
      id="connect"
      className="relative overflow-hidden border-b border-line bg-surface py-16 md:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-accent/10 blur-[130px] animate-orb-a"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-healthy/10 blur-[110px] animate-orb-b"
      />
      <div className="container-page relative flex flex-col items-center text-center">
        <Reveal>
          <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
            Ready when you are
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-4 max-w-2xl text-[26px] leading-[1.1] font-semibold tracking-[-0.035em] text-ink sm:text-[34px] md:text-[44px]">
            Your websites.{' '}
            <span className="text-accent">Monitored. Diagnosed. Fixed.</span>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="mt-4 max-w-xl text-[15px] text-ink-muted sm:text-base lg:text-[17px]">
            Connect your first site and see what your AI maintenance team finds in under two
            minutes.
          </p>
        </Reveal>

        <Reveal delay={220}>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link to="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full active:scale-[0.98] sm:w-auto">
                Connecter mon premier site
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/app" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="secondary"
                className="w-full active:scale-[0.98] sm:w-auto"
              >
                <Terminal className="size-4" />
                Voir une démo
              </Button>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={290}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-healthy" /> No credit card
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-healthy" /> First scan in 2 minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-healthy" /> No agents to configure
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

const footerCols = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', to: '/app' },
      { label: 'Websites', to: '/app/websites' },
      { label: 'Issues', to: '/app/issues' },
      { label: 'AI Agents', to: '/app/agents' },
      { label: 'Automations', to: '/app/automations' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'The problem', href: '#problem' },
      { label: 'Anatomy of a fix', href: '#platform' },
      { label: 'How it works', href: '#workflow' },
      { label: 'Live console', href: '#console' },
      { label: 'Changelog', href: '#changelog' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Multi-site management', href: '#agency' },
      { label: 'Agency scale', href: '#scale' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Sign in', to: '/app' },
      { label: 'Connect a site', to: '/onboarding' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact', href: 'mailto:hello@siteguard.ai' },
      { label: 'Support', href: 'mailto:support@siteguard.ai' },
      { label: 'Security', href: 'mailto:security@siteguard.ai' },
      { label: 'System status', to: '/app/activity' },
      { label: 'Activity log', to: '/app/activity' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-canvas py-10 sm:py-14">
      <div className="container-page">
        <div className="grid gap-8 border-b border-line pb-8 sm:grid-cols-2 sm:gap-10 sm:pb-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" aria-label="SiteGuard AI home">
              <Logo />
            </Link>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-muted">
              AI-powered website maintenance for agencies and teams that manage many sites.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link to="/app/activity">
                <StatusPill tone="healthy">All systems operational</StatusPill>
              </Link>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-faint">
                <Mail className="size-3.5" />
                hello@siteguard.ai
              </span>
            </div>
            <div className="mt-5">
              <CountUp
                to={14200}
                suffix="+"
                className="text-lg font-semibold text-ink"
              />
              <p className="text-[12px] text-ink-muted">URLs guarded right now</p>
            </div>
          </div>

          {footerCols.map((col, i) => (
            <Reveal key={col.title} delay={i * 60}>
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">
                  {col.title}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {'to' in l && l.to ? (
                        <Link
                          to={l.to}
                          className="text-[13px] text-ink-muted transition-colors hover:text-ink"
                        >
                          {l.label}
                        </Link>
                      ) : (
                        <a
                          href={'href' in l ? (l.href as string) : '#'}
                          className="text-[13px] text-ink-muted transition-colors hover:text-ink"
                        >
                          {l.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-faint">© 2026 SiteGuard AI. All rights reserved.</p>
          <p className="font-mono text-[11px] tracking-[0.1em] text-ink-faint uppercase">
            Monitoring 24/7 · AI diagnostics · Automated fixes · Multi-site
          </p>
        </div>
      </div>
    </footer>
  )
}
