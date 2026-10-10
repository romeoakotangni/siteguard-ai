import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IssueChainCard } from '../components/IssueChainCard'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui/Button'
import { HealthGauge } from '../components/ui/HealthGauge'
import { Field, Input } from '../components/ui/Input'
import { Panel, PanelBody, PanelHeader } from '../components/ui/Panel'
import { useAuth } from '../lib/auth'
import { useRealtime } from '../lib/realtime'

const stepLabels = [
  'Checking availability',
  'Computing health score',
  'Checking SEO',
  'Testing forms',
  'Analyzing errors',
  'Verifying security headers',
]

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [url, setUrl] = useState('')
  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState(step)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [upgrade, setUpgrade] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { user } = useAuth()
  const { connectWebsite, issues } = useRealtime()
  const navigate = useNavigate()

  if (activeStep !== step) {
    setActiveStep(step)
    if (step === 2) setProgress(0)
  }

  useEffect(() => {
    if (step !== 2) return
    if (!pending) {
      if (result) {
        setProgress(100)
        const t = setTimeout(() => setStep(3), 350)
        return () => clearTimeout(t)
      }
      if (error) {
        const t = setTimeout(() => setStep(1), 2200)
        return () => clearTimeout(t)
      }
      return
    }
    const started = Date.now()
    const timer = setInterval(() => {
      setProgress(Math.min(94, ((Date.now() - started) / 6500) * 94))
    }, 60)
    return () => clearInterval(timer)
  }, [step, pending, result, error])

  function start() {
    if (!user) {
      navigate('/register')
      return
    }
    if (!url.trim()) return
    setError('')
    setUpgrade(false)
    setResult(null)
    setProgress(0)
    setStep(2)
    setPending(true)
    const unwrap = (r: any) => (r?.data && typeof r.data === 'object' ? r.data : r)
    connectWebsite({ url })
      .then((r: any) => {
        const body = unwrap(r)
        if (body?.scanError) {
          setError(body.scanError)
          return
        }
        setResult(body)
      })
      .catch((e: any) => {
        setUpgrade(Boolean(e?.upgrade))
        setError(e?.message || 'Le scan a échoué')
      })
      .finally(() => setPending(false))
  }

  const payload = result?.data || result
  const site = payload?.website
  const scan = payload?.scan
  const findings = scan?.findings || []
  const countBy = (cat: string) => findings.filter((f: any) => f.category === cat).length

  const scanSteps = site
    ? [
        { label: 'Checking availability', result: `Up · ${site.response_ms || 0} ms` },
        { label: 'Computing health score', result: `${site.health_score}/100` },
        { label: 'Checking SEO', result: `${countBy('SEO')} SEO findings` },
        { label: 'Testing forms', result: countBy('Forms') ? `${countBy('Forms')} forms findings` : 'No form issues' },
        { label: 'Analyzing errors', result: `${findings.length} issues found` },
        { label: 'Verifying security headers', result: `${countBy('Security')} security findings` },
      ]
    : stepLabels.map((label) => ({ label, result: '' }))

  const doneCount = Math.min(scanSteps.length, Math.floor((progress / 100) * scanSteps.length))

  const logs = site
    ? findings.slice(0, 4).map((f: any) => `${f.detectedBy} — ${f.title} · ${f.path}`)
    : ['scan en cours — attente du serveur…']

  const siteIssues = site ? issues.filter((i) => i.siteId === site.id) : []

  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-5">
        <Link to="/">
          <Logo />
        </Link>
        <span className="text-[13px] text-ink-muted">Step {step} of 3</span>
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 pt-8 pb-16">
        {/* Progress segments */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={
                s < step
                  ? 'h-1 flex-1 rounded-full bg-accent'
                  : s === step
                    ? 'h-1 flex-1 animate-pulse rounded-full bg-accent'
                    : 'h-1 flex-1 rounded-full bg-line-strong'
              }
            />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-fade-up">
            <p className="text-[13px] font-semibold tracking-wide text-accent uppercase">
              Step 1 · Connect
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink">
              Connect your first website
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Paste the URL of a site you manage. AI agents start watching it immediately — availability,
              errors, performance, SEO and security.
            </p>

            <Panel className="mt-6">
              <PanelBody className="space-y-4">
                <Field label="Website URL" hint="We'll run a full scan in under 2 minutes.">
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="font-mono"
                    autoFocus
                  />
                </Field>
                {error && (
                  <p className="rounded-md border border-critical/25 bg-critical-tint px-3 py-2 text-[13px] text-critical">
                    {error}
                    {upgrade && (
                      <Link to="/app/billing" className="ml-2 font-semibold text-accent underline">
                        Passer à Pro
                      </Link>
                    )}
                  </p>
                )}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center gap-2 text-[13px] text-ink-muted">
                    <span className="size-1.5 rounded-full bg-healthy" />
                    Monitoring starts as soon as the scan completes
                  </span>
                  <Button onClick={start} disabled={!url.trim()} size="lg">
                    Start monitoring
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </PanelBody>
            </Panel>

            <div className="mt-4 flex items-center justify-between text-[13px]">
              <Link to="/" className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink">
                <ArrowLeft className="size-3.5" />
                Back
              </Link>
              <button
                type="button"
                onClick={start}
                disabled={!url.trim()}
                className="font-medium text-accent hover:underline disabled:opacity-50"
              >
                Lancer le scan réel
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up">
            <p className="text-[13px] font-semibold tracking-wide text-accent uppercase">
              Step 2 · Initial scan
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink">
              Scanning {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Your first full analysis usually takes under 2 minutes.
            </p>

            <Panel className="mt-6">
              <PanelHeader
                title="Scan progress"
                action={
                  <span className="text-[13px] font-medium text-accent tabular-nums">
                    {Math.round(progress)}%
                  </span>
                }
              />
              <PanelBody className="space-y-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-150 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <ul className="space-y-3">
                  {scanSteps.map((s, i) => {
                    const done = i < doneCount
                    const active = i === doneCount
                    return (
                      <li key={s.label} className="flex items-center gap-3">
                        <span
                          className={
                            done
                              ? 'flex size-5 items-center justify-center rounded-full bg-healthy text-white'
                              : active
                                ? 'flex size-5 items-center justify-center rounded-full bg-accent-tint text-accent'
                                : 'flex size-5 items-center justify-center rounded-full border border-line-strong text-transparent'
                          }
                        >
                          {done ? (
                            <Check className="size-3" />
                          ) : active ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : null}
                        </span>
                        <span
                          className={
                            done ? 'text-sm text-ink' : active ? 'text-sm font-medium text-ink' : 'text-sm text-ink-faint'
                          }
                        >
                          {s.label}
                        </span>
                        {done && (
                          <span className="ml-auto font-mono text-xs text-ink-muted">{s.result}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>

                <div className="rounded-md border border-line bg-canvas p-3 font-mono text-xs text-ink-muted">
                  <div className="max-h-24 space-y-1 overflow-hidden">
                    {logs.map((l: string) => (
                      <p key={l}>{l}</p>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="rounded-md border border-critical/25 bg-critical-tint px-3 py-2 text-[13px] text-critical">
                    {error}
                  </p>
                )}
              </PanelBody>
            </Panel>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={pending}
                className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink disabled:opacity-50"
              >
                <ArrowLeft className="size-3.5" />
                Back
              </button>
              {site && (
                <span className="inline-flex items-center gap-2 text-[13px] text-ink-muted">
                  <span className="size-1.5 animate-pulse rounded-full bg-healthy" />
                  Your site is already being watched
                </span>
              )}
            </div>
          </div>
        )}

        {step === 3 && result && (
          <div className="animate-fade-up">
            <p className="text-[13px] font-semibold tracking-wide text-accent uppercase">
              Step 3 · Result
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink">
              Your website health score
            </h1>

            <Panel className="mt-6">
              <PanelBody>
                <div className="flex flex-col items-center gap-5 sm:flex-row">
                  <HealthGauge score={site.health_score || 0} label="Initial health score" size={220} />
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-ink-soft">
                      The first scan of <span className="font-semibold text-ink">{site.domain}</span> is
                      complete. We found
                      <span className="font-semibold text-ink"> {findings.length} issues</span> —{' '}
                      {scan.critical} critical and {scan.warning} warnings. Each one comes with an AI
                      diagnosis and a proposed fix.
                    </p>
                    <dl className="mt-4 grid grid-cols-3 divide-x divide-line border-y border-line">
                      {[
                        ['Critical', String(scan.critical || 0), 'text-critical'],
                        ['Warning', String(scan.warning || 0), 'text-warning'],
                        ['Optimization', String(scan.optimization || 0), 'text-info'],
                      ].map(([label, value, tone]) => (
                        <div key={label} className="py-3 pr-3">
                          <dt className="text-xs text-ink-muted">{label}</dt>
                          <dd className={`text-xl font-semibold tabular-nums ${tone}`}>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </PanelBody>
            </Panel>

            {siteIssues.length > 0 && (
              <div className="mt-5 space-y-4">
                {siteIssues.slice(0, 2).map((issue) => (
                  <IssueChainCard key={issue.id} issue={issue} showChain={false} />
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/" className="text-[13px] text-ink-muted hover:text-ink">
                Back to homepage
              </Link>
              <Button size="lg" onClick={() => navigate(`/app/websites/${site.id}`)}>
                Review issues
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}