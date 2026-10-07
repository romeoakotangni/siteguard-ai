import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IssueChainCard } from '../components/IssueChainCard'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui/Button'
import { HealthGauge } from '../components/ui/HealthGauge'
import { Field, Input } from '../components/ui/Input'
import { Panel, PanelBody, PanelHeader } from '../components/ui/Panel'
import { issues } from '../data/mock'

const scanSteps = [
  { label: 'Checking availability', result: 'Up · 143 ms' },
  { label: 'Checking performance', result: 'LCP 2.1s · INP 120ms' },
  { label: 'Checking SEO', result: '47 pages crawled' },
  { label: 'Testing forms', result: '3 forms passed' },
  { label: 'Analyzing errors', result: '5 issues found' },
  { label: 'Verifying security headers', result: '4 of 5 present' },
]

const logs = [
  '10:44:02 · crawler — 47 pages indexed',
  '10:44:06 · monitor-agent — TLS valid, expires in 74 days',
  '10:44:09 · seo-agent — sitemap.xml · 63 URLs',
  '10:44:12 · form-agent — /contact → 200 OK',
  '10:44:15 · performance-agent — LCP 2.1s on 4G profile',
]

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [url, setUrl] = useState('https://example.com')
  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState(step)
  const navigate = useNavigate()

  if (activeStep !== step) {
    setActiveStep(step)
    if (step === 2) setProgress(0)
  }

  useEffect(() => {
    if (step !== 2) return
    const started = Date.now()
    const total = 6500
    const timer = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / total) * 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(timer)
        setStep(3)
      }
    }, 60)
    return () => clearInterval(timer)
  }, [step])

  const doneCount = Math.min(scanSteps.length, Math.floor((progress / 100) * scanSteps.length))

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
              Paste the URL of a site you manage. AI agents start watching it immediately —
              availability, errors, performance, SEO and forms.
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center gap-2 text-[13px] text-ink-muted">
                    <span className="size-1.5 rounded-full bg-healthy" />
                    Monitoring starts as soon as the scan completes
                  </span>
                  <Button onClick={() => setStep(2)} disabled={!url.trim()} size="lg">
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
                onClick={() => setStep(2)}
                className="font-medium text-accent hover:underline"
              >
                Voir une démo
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
              Scanning {url.replace(/^https?:\/\//, '')}
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
                  {logs[Math.min(logs.length - 1, Math.floor(progress / 20))]}
                </div>
              </PanelBody>
            </Panel>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink"
              >
                <ArrowLeft className="size-3.5" />
                Back
              </button>
              <span className="inline-flex items-center gap-2 text-[13px] text-ink-muted">
                <span className="size-1.5 animate-pulse rounded-full bg-healthy" />
                Your site is already being watched
              </span>
            </div>
          </div>
        )}

        {step === 3 && (
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
                  <HealthGauge score={87} label="Initial health score" size={220} />
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-ink-soft">
                      The first scan is complete. We found
                      <span className="font-semibold text-ink"> 5 issues</span> — 1 critical and 2
                      warnings. Each one comes with an AI diagnosis and a proposed fix.
                    </p>
                    <dl className="mt-4 grid grid-cols-3 divide-x divide-line border-y border-line">
                      {[
                        ['Critical', '1', 'text-critical'],
                        ['Warning', '2', 'text-warning'],
                        ['Optimization', '2', 'text-info'],
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

            <div className="mt-5 space-y-4">
              {issues.slice(0, 2).map((issue) => (
                <IssueChainCard key={issue.id} issue={issue} showChain={false} />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/" className="text-[13px] text-ink-muted hover:text-ink">
                Back to homepage
              </Link>
              <Button size="lg" onClick={() => navigate('/app/issues')}>
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
