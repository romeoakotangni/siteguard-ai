import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  CircleAlert,
  FileText,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Network,
  Palette,
  Sparkles,
  Terminal,
  Wand2,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CountUp, Reveal } from '../motion/Reveal'
import { Tilt } from '../motion/Tilt'
import { LogoMarquee } from './LogoMarquee'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/Status'
import { cn } from '../../lib/utils'

/* ---------------------------------------------------------------- head */

function SectionHead({
  eyebrow,
  title,
  sub,
  tone = 'accent',
  align = 'left',
  className,
}: {
  eyebrow: string
  title: ReactNode
  sub?: ReactNode
  tone?: 'accent' | 'critical' | 'neutral'
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto max-w-2xl text-center',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mb-3 block h-px w-16 origin-left bg-gradient-to-r from-accent to-transparent animate-grow-x',
          align === 'center' && 'mx-auto bg-gradient-to-r from-transparent via-accent to-transparent',
        )}
      />
      <p
        className={cn(
          'font-mono text-[11px] font-semibold tracking-[0.16em] uppercase',
          tone === 'accent' && 'text-accent',
          tone === 'critical' && 'text-critical',
          tone === 'neutral' && 'text-ink-faint',
        )}
      >
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[24px] leading-[1.12] font-semibold tracking-[-0.03em] text-ink sm:text-[30px] md:text-4xl">
        {title}
      </h2>
      {sub && (
        <p className="mt-3 text-[14px] leading-relaxed text-ink-muted sm:mt-4 sm:text-[15px] md:text-base">
          {sub}
        </p>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- trust */

const trustStats: {
  to: number
  decimals?: number
  prefix?: string
  suffix?: string
  label: string
}[] = [
  { to: 14200, suffix: '+', label: 'URLs guarded' },
  { to: 99.98, decimals: 2, suffix: '%', label: 'Detection accuracy' },
  { to: 45, prefix: '<', suffix: 's', label: 'Median time to detect' },
]

export function TrustStrip() {
  const labels = [
    'Monitoring 24/7',
    'AI diagnostics',
    'Automated fixes',
    'Multi-site reliability',
  ]

  return (
    <section className="border-b border-line bg-canvas">
      <div className="container-page py-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase sm:gap-x-5 sm:text-[11px]">
          {labels.map((label, i) => (
            <span key={label} className="flex items-center gap-5">
              {i > 0 && <span className="hidden h-3 w-px bg-line-strong sm:block" />}
              {label}
            </span>
          ))}
        </div>

        {/* client logos, right to left, endless */}
        <div className="mt-3 border-y border-line">
          <LogoMarquee />
        </div>

        <div className="mt-5 grid gap-5 divide-y divide-line sm:mt-6 sm:grid-cols-3 sm:gap-6 sm:divide-x sm:divide-y-0">
          {trustStats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90} className="py-4 text-center sm:py-0">
              <CountUp
                to={s.to}
                decimals={s.decimals}
                prefix={s.prefix}
                suffix={s.suffix}
                duration={1600}
                className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-[28px]"
              />
              <p className="mt-0.5 text-[13px] text-ink-muted">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- problem */

const problems = [
  {
    label: 'Broken links',
    badge: 'HTTP 404',
    tone: 'critical' as const,
    desc: 'Navigation pointing to removed pages',
    agent: 'Monitor Agent',
    time: '12 min ago',
  },
  {
    label: 'Silent downtime',
    badge: 'HTTP 502',
    tone: 'critical' as const,
    desc: 'Origin down — nobody notices for hours',
    agent: 'Monitor Agent',
    time: '3 min ago',
  },
  {
    label: 'Performance regressions',
    badge: 'LCP +1.8s',
    tone: 'warning' as const,
    desc: 'A deploy doubles your load time',
    agent: 'Performance Agent',
    time: '41 min ago',
  },
  {
    label: 'Frontend exceptions',
    badge: 'JS Exception',
    tone: 'critical' as const,
    desc: 'A broken script kills the conversion flow',
    agent: 'Monitor Agent',
    time: '8 min ago',
  },
  {
    label: 'SEO de-indexing',
    badge: 'De-indexing',
    tone: 'warning' as const,
    desc: 'Pages silently dropping out of search results',
    agent: 'SEO Agent',
    time: '1 h ago',
  },
]

export function ProblemSection() {
  return (
    <section id="problem" className="border-b border-line bg-canvas py-12 sm:py-16 md:py-20">
      <div className="container-page">
        <SectionHead
          eyebrow="Operational blind spots"
          tone="critical"
          title="Websites break quietly."
          sub="A link 404s. A form stops sending. A deploy tanks your speed. By the time a client notices, revenue and trust are already gone — and your team is firefighting instead of building."
        />

        <div className="mt-9 overflow-hidden rounded-xl border border-line bg-surface">
          {problems.map((p, i) => (
            <Reveal key={p.label} delay={i * 70} variant="left" y={18}>
              <div
                className={cn(
                  'group flex flex-col gap-2.5 px-4 py-3.5 transition-colors hover:bg-canvas sm:gap-3 sm:px-5 sm:py-4 sm:flex-row sm:items-center sm:justify-between',
                  i < problems.length - 1 && 'border-b border-line',
                )}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125',
                      p.tone === 'critical' ? 'bg-critical' : 'bg-warning',
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{p.label}</p>
                    <p className="text-[13px] text-ink-muted">{p.desc}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4 pl-5 sm:pl-0">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-[4px] border px-2 py-0.5 font-mono text-[11px] font-medium',
                      p.tone === 'critical'
                        ? 'border-critical/25 bg-critical-tint text-critical'
                        : 'border-warning/30 bg-warning-tint text-warning',
                    )}
                  >
                    {p.badge}
                  </span>
                  <span className="hidden text-[12px] text-ink-faint lg:block">
                    Detected by {p.agent} · {p.time}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-ink-muted">
              This is a sample of what the agents caught in the last hour.
            </p>
            <Link
              to="/app/issues"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent transition-colors hover:text-accent-hover"
            >
              See every open issue
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- solution */

const anatomySteps = [
  {
    step: 'Step 01',
    kind: 'Problem',
    title: 'Detect',
    desc: 'A navigation link returns HTTP 404 on 3 pages.',
    tone: 'neutral' as const,
  },
  {
    step: 'Step 02',
    kind: 'AI diagnosis',
    title: 'Explain',
    desc: 'The redirect was dropped in last night’s deploy.',
    tone: 'info' as const,
  },
  {
    step: 'Step 03',
    kind: 'Recommended action',
    title: 'Fix',
    desc: 'Restore a 301 from /services to /pricing.',
    tone: 'accent' as const,
  },
  {
    step: 'Step 04',
    kind: 'Result',
    title: 'Verify',
    desc: 'Re-scanned: HTTP 200 — issue closed in 47s.',
    tone: 'healthy' as const,
  },
]

function IssueCard() {
  const [events, setEvents] = useState<string[]>([])
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    if (!pending) return
    const copy = {
      simulate: 'Simulation passed · 0 pages impacted · no redirect loop',
      github: 'Pull request #128 opened · checks running in staging',
    }[pending as 'simulate' | 'github']
    const t = setTimeout(() => {
      setEvents((prev) => [...prev.slice(-1), copy])
      setPending(null)
    }, 550)
    return () => clearTimeout(t)
  }, [pending])

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-hero">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-critical opacity-70" />
          <span className="relative inline-flex size-2.5 rounded-full bg-critical" />
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
          Broken link detected: <span className="font-mono">/services → /pricing</span>
        </p>
        <span className="inline-flex items-center rounded-[4px] border border-critical/25 bg-critical-tint px-2 py-0.5 font-mono text-[11px] font-semibold text-critical">
          Critical · HTTP 404
        </span>
      </div>

      <div className="space-y-4 p-5">
        {/* diagnosis */}
        <div className="rounded-lg border border-line bg-canvas p-4">
          <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
            <Sparkles className="size-3 text-accent" />
            AI root-cause diagnosis
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
            The link targets a page that returns HTTP 404. It sits in the main navigation and on 3
            inner pages. Organic traffic to this URL dropped 100% since the last deploy.
          </p>
        </div>

        {/* remediation diff */}
        <div className="rounded-lg border border-line bg-canvas p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
              <Wand2 className="size-3 text-accent" />
              Automated remediation diff
            </p>
            <span className="font-mono text-[11px] text-ink-muted">
              confidence <span className="font-semibold text-ink">99.4%</span>
            </span>
          </div>

          <div className="mt-2.5 overflow-x-auto rounded-[4px] border border-[#1b1f27] bg-[#0d1117] px-3 py-2.5 font-mono text-[12px] leading-6 scroll-thin">
            <p className="text-[#7d8590] whitespace-nowrap">htaccess · redirect rules</p>
            <p className="text-[#ff7b72] whitespace-nowrap">- # redirect removed in deploy a1f3c2</p>
            <p className="text-[#3fb950] whitespace-nowrap">+ redirect 301 /services /pricing</p>
            <p className="text-[#3fb950] whitespace-nowrap">
              + redirect 301 /services/web-development /pricing
            </p>
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-muted">
            <Check className="size-3.5 shrink-0 text-healthy" />
            Automated rollback tests passed in the staging sandbox
          </p>
        </div>

        {/* live events */}
        {events.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-accent/20 bg-accent-tint-soft px-3.5 py-2.5">
            {events.map((e) => (
              <p
                key={e}
                className="flex items-center gap-2 font-mono text-[11px] text-accent animate-fade-up"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-accent" />
                {e}
              </p>
            ))}
          </div>
        )}

        {/* actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button
            size="sm"
            variant="secondary"
            disabled={pending !== null}
            onClick={() => setPending('simulate')}
          >
            <Activity className="size-3.5" />
            Simulate impact
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={pending !== null}
            onClick={() => setPending('github')}
          >
            <GitGlyph />
            Auto-apply in GitHub
          </Button>
          <Link to="/app/issues/1042" className="ml-auto">
            <Button size="sm" className="active:scale-[0.98]">
              Review &amp; Fix
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
        {pending && (
          <p className="flex items-center gap-2 font-mono text-[11px] text-ink-muted animate-fade-in">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" />
            Running in sandbox…
          </p>
        )}
      </div>
    </div>
  )
}

function GitGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5" aria-hidden>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      <path d="M6 8.5v7M18 10.5c0 4-4 4.5-6 5.5" strokeLinecap="round" />
    </svg>
  )
}

export function SolutionSection() {
  return (
    <section id="platform" className="border-b border-line bg-surface py-12 sm:py-16 md:py-20">
      <div className="container-page grid items-start gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
        <Reveal variant="left" y={24}>
          <div>
          <SectionHead
            eyebrow="The anatomy of a fix"
            title={
              <>
                Autonomous diagnosis
                <br />
                &amp; remediation
              </>
            }
            sub="SiteGuard doesn’t just show numbers. Every issue walks the same four steps — evidence in, verified fix out."
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {anatomySteps.map((s, i) => (
              <Reveal key={s.step} delay={i * 70}>
                <div
                  className={cn(
                    'h-full rounded-lg border p-4 transition-shadow',
                    s.tone === 'accent'
                      ? 'border-accent bg-accent-tint-soft shadow-[0_1px_3px_0_rgb(31_94_255/0.14)]'
                      : 'border-line bg-canvas hover:shadow-card',
                  )}
                >
                  <p
                    className={cn(
                      'font-mono text-[10px] font-semibold tracking-[0.14em] uppercase',
                      s.tone === 'accent' && 'text-accent',
                      s.tone === 'info' && 'text-info',
                      s.tone === 'healthy' && 'text-healthy',
                      s.tone === 'neutral' && 'text-ink-faint',
                    )}
                  >
                    {s.step} · {s.kind}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">{s.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={140}>
            <Link to="/onboarding" className="mt-7 inline-block">
              <Button size="lg">Connecter mon premier site</Button>
            </Link>
          </Reveal>
          </div>
        </Reveal>

        <Reveal delay={120} y={24} variant="right">
          <IssueCard />
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- how it works */

const phases = [
  { title: 'Connect your site', desc: 'Paste a URL. No code, no DNS changes.', tag: 'URL only', tone: 'text-accent' },
  { title: 'AI monitors it', desc: 'Six agents sweep your site around the clock.', tag: '24/7', tone: 'text-info' },
  { title: 'Problems are diagnosed', desc: 'Every issue explained with the evidence.', tag: 'Plain language', tone: 'text-warning' },
  { title: 'Fixes are proposed', desc: 'A concrete correction, ready to review.', tag: 'One click', tone: 'text-critical' },
  { title: 'You approve or automate', desc: 'Or let safe fixes run themselves.', tag: 'Approval gate', tone: 'text-healthy' },
]

export function HowItWorks() {
  return (
    <section id="workflow" className="border-b border-line bg-canvas py-12 sm:py-16 md:py-20">
      <div className="container-page">
        <SectionHead
          eyebrow="Setup & dispatch"
          title="How it works in 5 simple phases."
          sub="From a pasted URL to a verified fix — without a single line of monitoring config."
        />

        <ol className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {phases.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <li className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop sm:p-5">
                <div className="flex size-7 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-ink">{p.title}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-muted">{p.desc}</p>
                <p className={cn('mt-4 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase', p.tone)}>
                  {p.tag}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ------------------------------------------------------- product preview */

const consoleNav = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true, to: '/app' },
  { icon: Globe, label: 'Websites', to: '/app/websites' },
  { icon: CircleAlert, label: 'Issues', to: '/app/issues' },
  { icon: Bot, label: 'Agents', to: '/app/agents' },
  { icon: FileText, label: 'Reports', to: '/app/reports' },
]

const consoleRows = [
  { domain: 'acme-studio.com', status: 'healthy', score: 94, issues: 1, trigger: 'Schedule · 5m', last: '2 min ago', action: 'Run Check', to: '/app/websites/acme-studio' },
  { domain: 'nordic-fit.io', status: 'warning', score: 88, issues: 3, trigger: 'Issue detected', last: '6 min ago', action: 'Review PR', to: '/app/issues' },
  { domain: 'luminex-agency.com', status: 'healthy', score: 97, issues: 0, trigger: 'Manual', last: '11 min ago', action: 'Inspect', to: '/app/websites/luminex' },
  { domain: 'harborlegal.com', status: 'critical', score: 62, issues: 6, trigger: 'Uptime probe', last: 'just now', action: 'Auto-fix', to: '/app/issues' },
  { domain: 'verde-coffee.co', status: 'healthy', score: 91, issues: 1, trigger: 'Lighthouse CI', last: '24 min ago', action: 'Run Check', to: '/app/websites/verde-coffee' },
  { domain: 'atlas-consulting.fr', status: 'warning', score: 85, issues: 2, trigger: 'Issue detected', last: '31 min ago', action: 'Review PR', to: '/app/issues' },
] as const

export function ProductPreview() {
  return (
    <section id="console" className="border-b border-line bg-surface py-12 sm:py-16 md:py-20">
      <div className="container-page">
        <SectionHead
          eyebrow="Operational control"
          title="Production workspace console."
          sub="Hierarchical, quiet, and always one click from a fix — every site, trigger and action in a single workspace."
          align="center"
        />

        <Reveal delay={100} y={24}>
          <div className="mx-auto mt-9 max-w-5xl overflow-hidden rounded-xl border border-line bg-surface shadow-hero">
            <div className="grid md:grid-cols-[184px_1fr]">
              {/* mini sidebar */}
              <aside className="hidden border-r border-line bg-canvas p-3 md:block">
                <p className="px-2 pb-2 font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">
                  Console
                </p>
                <nav className="space-y-0.5">
                  {consoleNav.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={cn(
                        'flex items-center gap-2 rounded-[4px] px-2 py-1.5 text-[13px] transition-colors',
                        item.active
                          ? 'border border-line bg-surface font-semibold text-ink shadow-card'
                          : 'text-ink-muted hover:bg-surface hover:text-ink',
                      )}
                    >
                      <item.icon className={cn('size-3.5', item.active && 'text-accent')} />
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-4 rounded-[4px] border border-line bg-surface p-2.5">
                  <p className="font-mono text-[10px] text-ink-faint uppercase">Workspace</p>
                  <p className="mt-1 text-[13px] font-semibold text-ink">Northline Agency</p>
                  <p className="text-[11px] text-ink-muted">24 / 100 sites</p>
                </div>
              </aside>

              {/* table */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">Production Workspace</p>
                    <p className="text-[11px] text-ink-faint">
                      24 websites · 6 agents · updated 4s ago
                    </p>
                  </div>
                  <StatusPill tone="healthy">All systems nominal</StatusPill>
                </div>

                <div className="hidden grid-cols-[1.4fr_0.6fr_0.5fr_1fr_0.7fr_auto] gap-3 border-b border-line px-4 py-2 font-mono text-[10px] tracking-[0.12em] text-ink-faint uppercase sm:grid">
                  <span>Site</span>
                  <span>Health</span>
                  <span>Issues</span>
                  <span>Trigger</span>
                  <span>Check</span>
                  <span className="text-right">Action</span>
                </div>

                <ul className="divide-y divide-line">
                  {consoleRows.map((row) => (
                    <li
                      key={row.domain}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas sm:grid sm:grid-cols-[1.4fr_0.6fr_0.5fr_1fr_0.7fr_auto] sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span
                          className={cn(
                            'size-1.5 shrink-0 rounded-full',
                            row.status === 'healthy' && 'bg-healthy',
                            row.status === 'warning' && 'bg-warning',
                            row.status === 'critical' && 'bg-critical',
                          )}
                        />
                        <span className="truncate text-sm font-medium text-ink">{row.domain}</span>
                      </div>

                      <span
                        className={cn(
                          'shrink-0 text-right text-sm font-semibold tabular-nums sm:text-left',
                          row.score >= 90 ? 'text-healthy' : row.score >= 70 ? 'text-warning' : 'text-critical',
                        )}
                      >
                        {row.score}
                      </span>

                      <span className="shrink-0 text-sm text-ink-muted tabular-nums sm:text-left">
                        {row.issues}
                      </span>

                      <span className="hidden font-mono text-[11px] text-ink-muted sm:block">
                        {row.trigger}
                      </span>
                      <span className="hidden text-[12px] text-ink-faint sm:block">{row.last}</span>

                      <span className="shrink-0 text-right">
                        <Link to={row.to}>
                          <span className="inline-flex h-8 items-center rounded-[4px] border border-line-strong bg-surface px-2.5 text-[12px] font-medium text-ink transition-all hover:border-accent hover:text-accent active:scale-[0.97] sm:h-7">
                            {row.action}
                          </span>
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-line bg-canvas px-4 py-2.5">
                  <span className="font-mono text-[10px] text-ink-faint sm:text-[11px]">
                    <Terminal className="mr-1.5 -mt-0.5 inline size-3" />
                    6 agents sweeping · 14,200 URLs
                  </span>
                  <Link
                    to="/app"
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent transition-colors hover:text-accent-hover"
                  >
                    Open dashboard
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- multi-site */

const multiSiteCards = [
  {
    icon: Network,
    title: 'Multi-tenant workspaces',
    desc: 'Every client isolated with its own health rollup — one console for you.',
    points: ['Per-client dashboards', 'Roles for clients & teammates', 'Bulk scans across the portfolio'],
  },
  {
    icon: Palette,
    title: 'White-label reports',
    desc: 'Your logo, your domain, your report — delivered on your schedule.',
    points: ['Branded PDF & web reports', 'Weekly client digests', 'Custom score thresholds'],
  },
  {
    icon: MessageSquare,
    title: 'Slack & email delivery',
    desc: 'Alerts where your team already works, with the fix attached.',
    points: ['Slack channels per client', 'Approval buttons in Slack', 'Quiet hours & escalation'],
  },
]

export function MultiSiteSection() {
  return (
    <section id="agency" className="border-b border-line bg-canvas py-12 sm:py-16 md:py-20">
      <div className="container-page">
        <SectionHead
          eyebrow="Agency architecture"
          title="One console. Every client site."
          sub="Run 20, 50 or 100 sites from a single workspace: per-client health rollups, white-label reports and agent activity, all in one place."
          align="center"
        />

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {multiSiteCards.map((card, i) => (
            <Reveal key={card.title} delay={i * 90}>
              <Tilt max={5} className="h-full">
              <article className="flex h-full flex-col rounded-xl border border-line bg-surface p-6 transition-shadow duration-300 hover:shadow-pop">
                <span className="flex size-9 items-center justify-center rounded-[4px] border border-line bg-canvas text-ink-soft">
                  <card.icon className="size-4" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{card.desc}</p>
                <ul className="mt-4 flex-1 space-y-2 border-t border-line pt-4">
                  {card.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[13px] text-ink-soft">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-healthy" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
              </Tilt>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150}>
          <div className="mt-7 flex flex-col items-center gap-3 text-center">
            <Link to="/onboarding">
              <Button size="lg" className="active:scale-[0.98]">
                Connecter mon premier site
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <p className="text-[13px] text-ink-faint">Bring your whole portfolio — import in bulk.</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------- agency workflow */

const scaleColumns = [
  {
    size: '20 sites',
    profile: 'Boutique studio',
    points: ['All six agents on every site', 'Weekly white-label reports', 'Slack alerts for criticals'],
    stat: '≈ 4 min',
    statLabel: 'of human work per week',
    highlighted: false,
  },
  {
    size: '50 sites',
    profile: 'Growing agency',
    points: ['Everything in 20 sites', 'Bulk scans across the portfolio', 'Client roles & approval gates'],
    stat: '≈ 11 min',
    statLabel: 'of human work per week',
    highlighted: true,
  },
  {
    size: '100 sites',
    profile: 'Multi-brand teams',
    points: ['Everything in 50 sites', 'API + custom rules', 'Dedicated success engineer'],
    stat: '≈ 19 min',
    statLabel: 'of human work per week',
    highlighted: false,
  },
]

export function AgencyWorkflow() {
  return (
    <section id="scale" className="border-b border-line bg-surface py-12 sm:py-16 md:py-20">
      <div className="container-page">
        <SectionHead
          eyebrow="Scale scenarios"
          title="Designed to scale from boutique to enterprise."
          sub="The bigger the portfolio, the smaller the human workload — agents do the sweeping, your team only reviews what matters."
        />

        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {scaleColumns.map((col, i) => (
            <Reveal key={col.size} delay={i * 90}>
              <Tilt max={5} className="h-full">
              <div
                className={cn(
                  'flex h-full flex-col rounded-xl border bg-surface p-6 transition-shadow duration-300',
                  col.highlighted
                    ? 'border-accent shadow-[0_8px_24px_-12px_rgb(31_94_255/0.35)]'
                    : 'border-line hover:shadow-pop',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xl font-semibold tracking-[-0.02em] text-ink">{col.size}</p>
                  {col.highlighted && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white uppercase">
                      Most popular
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-ink-muted">{col.profile}</p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {col.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-ink-soft">
                      <Check className="mt-0.5 size-4 shrink-0 text-healthy" />
                      {p}
                    </li>
                  ))}
                </ul>

                <div
                  className={cn(
                    'mt-5 rounded-lg border px-3.5 py-3',
                    col.highlighted ? 'border-accent/25 bg-accent-tint-soft' : 'border-line bg-canvas',
                  )}
                >
                  <p className={cn('text-lg font-semibold', col.highlighted ? 'text-accent' : 'text-ink')}>
                    {col.stat}
                  </p>
                  <p className="text-[12px] text-ink-muted">{col.statLabel}</p>
                  <p className="mt-1.5 font-mono text-[10px] tracking-[0.1em] text-healthy uppercase">
                    0 missed problems
                  </p>
                </div>
              </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- changelog */

const releases = [
  { version: 'v2.4', date: 'Oct 2026', title: 'GitHub auto-apply for redirect fixes', desc: 'PRs open with rollback, impact simulation runs first.', dot: 'bg-accent' },
  { version: 'v2.3', date: 'Sep 2026', title: 'Slack digest with per-client rollups', desc: 'One message per client with health, issues and fixes.', dot: 'bg-healthy' },
  { version: 'v2.2', date: 'Sep 2026', title: 'Performance Agent tracks LCP by template', desc: 'Regressions attributed to the page template that caused them.', dot: 'bg-warning' },
  { version: 'v2.1', date: 'Aug 2026', title: 'Approval gates for automated fixes', desc: 'Choose which categories agents may apply without review.', dot: 'bg-info' },
]

export function ChangelogSection() {
  return (
    <section id="changelog" className="border-b border-line bg-canvas py-12 sm:py-16 md:py-20">
      <div className="container-page grid items-start gap-8 lg:grid-cols-[320px_1fr]">
        <SectionHead
          eyebrow="Changelog"
          tone="neutral"
          title="Shipped weekly."
          sub="New agents, deeper diagnosis and faster fixes — released every week."
        />

        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {releases.map((r, i) => (
            <Reveal key={r.version} delay={i * 80} variant="blur" y={12}>
              <div
                className={cn(
                  'group flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-canvas sm:flex-row sm:items-center sm:gap-5',
                  i < releases.length - 1 && 'border-b border-line',
                )}
              >
                <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-[4px] border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-semibold text-ink">
                  <span className={cn('size-1.5 rounded-full', r.dot)} />
                  {r.version}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{r.title}</p>
                  <p className="text-[13px] text-ink-muted">{r.desc}</p>
                </div>
                <span className="font-mono text-[11px] text-ink-faint">{r.date}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
