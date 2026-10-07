import { ArrowRight, Menu, Terminal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../Logo'
import { Button } from '../ui/Button'
import { Reveal } from '../motion/Reveal'
import { cn } from '../../lib/utils'

const links = [
  { href: '#platform', label: 'Platform' },
  { href: '#agents', label: 'Agents' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#changelog', label: 'Changelog' },
]

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="group inline-flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-[4px] bg-ink text-white transition-colors duration-200 group-hover:bg-accent">
        <LogoMark className="size-4" />
      </span>
      {!compact && (
        <span className="text-sm font-semibold tracking-[-0.01em] text-ink">
          SiteGuard <span className="font-normal text-ink-muted">AI</span>
        </span>
      )}
    </span>
  )
}

export function MarketingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="container-page flex h-12 items-center justify-between gap-6">
        <Link to="/" aria-label="SiteGuard AI home">
          <Brand />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#console"
            className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink sm:inline-flex"
          >
            <Terminal className="size-3.5" />
            Voir une démo
          </a>
          <Link to="/onboarding" className="hidden sm:block">
            <Button size="sm">Connecter mon premier site</Button>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex size-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface-muted md:hidden"
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-surface px-6 py-2 md:hidden animate-fade-in">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block border-b border-line py-3 text-sm font-medium text-ink-soft last:border-0"
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 py-3">
            <a
              href="#console"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface text-sm font-medium text-ink"
            >
              <Terminal className="size-4" />
              Voir une démo
            </a>
            <Link to="/onboarding" onClick={() => setOpen(false)}>
              <Button className="w-full">Connecter mon premier site</Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      {/* ambient animated orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-accent/12 blur-[130px] animate-orb-a"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-52 -left-24 size-80 rounded-full bg-info/10 blur-[110px] animate-orb-b"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-6rem] bottom-16 size-72 rounded-full bg-healthy/10 blur-[110px] animate-orb-b"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[linear-gradient(to_right,rgb(16_24_40/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(16_24_40/0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_65%_75%_at_50%_0%,black,transparent)]"
      />

      <div className="container-page relative pb-12 pt-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 font-mono text-[10px] tracking-[0.08em] text-ink-soft uppercase backdrop-blur animate-glow-pulse sm:text-[11px]">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-healthy opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-healthy" />
              </span>
              AI-powered website maintenance
            </span>
          </Reveal>

          <h1
            className="mt-5 text-[32px] leading-[1.05] font-semibold tracking-[-0.035em] text-ink sm:mt-6 sm:text-[44px] lg:text-[56px]"
            aria-label="Your websites. Monitored. Diagnosed. Fixed."
          >
            <SplitWords text="Your websites." delay={120} />
            <span className="mt-1 block text-accent">
              <SplitWords text="Monitored. Diagnosed. Fixed." delay={420} step={110} />
            </span>
          </h1>

          <Reveal delay={560}>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:mt-5 sm:text-base lg:text-[17px]">
              AI agents continuously monitor your websites, detect problems and help your team fix
              them before they become costly.
            </p>
          </Reveal>

          <Reveal delay={640}>
            <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
              <Link to="/onboarding" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  Connecter mon premier site
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a href="#console" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  <Terminal className="size-4" />
                  Voir une démo
                </Button>
              </a>
            </div>
          </Reveal>

          <Reveal delay={720}>
            <p className="mt-4 text-[12px] text-ink-faint sm:mt-5 sm:text-[13px]">
              No credit card required · First scan in under 2 minutes
            </p>
          </Reveal>
        </div>

        <Reveal delay={820} y={28} variant="scale">
          <HeroPreview />
        </Reveal>
      </div>
    </section>
  )
}

/** Word-by-word rise-in used in the hero headline. */
function SplitWords({
  text,
  delay = 0,
  step = 70,
}: {
  text: string
  delay?: number
  step?: number
}) {
  return (
    <>
      {text.split(' ').map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden pb-1 align-bottom"
          aria-hidden
        >
          <span
            className="inline-block animate-rise"
            style={{ animationDelay: `${delay + i * step}ms` }}
          >
            {word}
            {'\u00A0'}
          </span>
        </span>
      ))}
    </>
  )
}

const fleet = [
  { name: 'Monitor', state: 'Running', meta: '18ms', tone: 'healthy' as const, live: true },
  { name: 'SEO', state: 'Idle', meta: 'Next in 4m', tone: 'neutral' as const, live: false },
  { name: 'Fix agent', state: '1 PR open', meta: 'Awaiting review', tone: 'info' as const, live: true },
]

function HealthRing({ value }: { value: number }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 250)
    return () => clearTimeout(t)
  }, [])

  const r = 26
  const circumference = 2 * Math.PI * r

  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-line)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="var(--color-healthy)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? circumference * (1 - value / 100) : circumference}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg leading-none font-semibold text-ink tabular-nums">{value}</span>
        <span className="text-[9px] text-ink-faint">/100</span>
      </span>
    </div>
  )
}

/** The product itself is the visual — a real console panel, no illustrations. */
function HeroPreview() {
  const [seconds, setSeconds] = useState(4)

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s >= 12 ? 1 : s + 1)), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mx-auto mt-8 max-w-4xl animate-float md:mt-12">
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-hero">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-line bg-canvas px-3 py-2.5 sm:px-4">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="hidden flex-1 justify-center sm:flex">
            <span className="rounded border border-line bg-surface px-3 py-0.5 font-mono text-[11px] text-ink-faint">
              cluster-eu-west-1 / prod-active
            </span>
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-healthy/20 bg-healthy-tint px-2 py-0.5 text-[10px] font-semibold text-healthy uppercase">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-healthy opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-healthy" />
            </span>
            <span className="hidden sm:inline">Live telemetry active</span>
            <span className="sm:hidden">Live</span>
          </span>
        </div>

        {/* health + stats */}
        <div className="grid gap-4 p-4 sm:gap-5 sm:p-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex items-center gap-4">
            <HealthRing value={94} />
            <div>
              <p className="text-sm font-semibold text-ink">acme-studio.com</p>
              <p className="text-[12px] text-ink-faint">Last scan 2 min ago</p>
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-healthy/20 bg-healthy-tint px-2 py-0.5 text-[11px] font-semibold text-healthy">
                <span className="size-1.5 rounded-full bg-healthy" />
                Healthy
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-warning/25 bg-warning-tint px-3.5 py-3">
              <p className="font-mono text-[10px] tracking-[0.1em] text-warning uppercase">
                Active issues
              </p>
              <p className="mt-1 text-xl font-semibold text-ink tabular-nums">7</p>
              <p className="text-[11px] text-ink-muted">issues detected</p>
            </div>
            <div className="rounded-lg border border-info/25 bg-info-tint px-3.5 py-3">
              <p className="font-mono text-[10px] tracking-[0.1em] text-info uppercase">
                Pending reviews
              </p>
              <p className="mt-1 text-xl font-semibold text-ink tabular-nums">3</p>
              <p className="text-[11px] text-ink-muted">waiting approval</p>
            </div>
          </div>
        </div>

        {/* synchronized agent fleet */}
        <div className="border-t border-line bg-canvas px-4 py-3.5 sm:px-5 sm:py-4">
          <p className="font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">
            Synchronized agent fleet
          </p>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3 sm:gap-3">
            {fleet.map((agent) => (
              <div
                key={agent.name}
                className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 transition-shadow hover:shadow-card"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{agent.name}</p>
                  <p className="truncate text-[11px] text-ink-muted">
                    {agent.state} · {agent.meta}
                  </p>
                </div>
                <span
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    agent.tone === 'healthy' && 'bg-healthy',
                    agent.tone === 'info' && 'animate-pulse-dot bg-info',
                    agent.tone === 'neutral' && 'bg-line-strong',
                    agent.live && agent.tone !== 'info' && 'animate-pulse',
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-line px-4 py-3 sm:px-5">
          <span className="font-mono text-[11px] text-ink-faint tabular-nums">
            6 agents active · last sync {seconds}s ago
            <span className="ml-1 inline-block size-1.5 rounded-full bg-healthy align-middle animate-scan" />
          </span>
          <Link
            to="/app"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent transition-colors hover:text-accent-hover"
          >
            Open live dashboard
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
