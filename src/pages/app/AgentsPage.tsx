import { ArrowRight, Check, Play, Radio, Square } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/app/AppLayout'
import { Button } from '../../components/ui/Button'
import { Sparkline } from '../../components/ui/Metric'
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel'
import { StatusPill } from '../../components/ui/Status'
import { api } from '../../lib/api'
import RequireSubscription from '../../components/RequireSubscription'

const icons: Record<string, string> = {
  monitor: '🖥',
  performance: '⚡',
  seo: '🔍',
  form: '📋',
  security: '🔒',
  fix: '🛠',
}

interface Agent {
  id: string
  name: string
  type: string
  status: string
  last_run_at: string | null
  config: any
  scope?: string
  role?: string
  detected?: number
  fixed?: number
  lastAnalysis?: string
  activity?: number[]
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [running, setRunning] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const res: any = await api.agents.list()
        const list = (res.data?.agents || []).map((a: any) => ({
          ...a,
          scope: 'Realtime',
          role: a.type || 'Agent',
          detected: 0,
          fixed: 0,
          lastAnalysis: a.last_run_at ? new Date(a.last_run_at).toLocaleTimeString() : '—',
          activity: [4, 6, 5, 8, 7, 9, 6, 11, 8, 7, 10, 9],
        }))
        setAgents(list)
      } catch (e: any) {
        setError(e?.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalDetected = agents.reduce((sum, a) => sum + (a.detected || 0), 0)
  const totalFixed = agents.reduce((sum, a) => sum + (a.fixed || 0), 0)

  const run = async (agent: Agent) => {
    try {
      setRunning((r) => ({ ...r, [agent.id]: true }))
      await api.agents.run(agent.id, agent.type)
      const res: any = await api.agents.list()
      const list = (res.data?.agents || []).map((a: any) => ({
        ...a,
        scope: 'Realtime',
        role: a.type || 'Agent',
        detected: 0,
        fixed: 0,
        lastAnalysis: a.last_run_at ? new Date(a.last_run_at).toLocaleTimeString() : '—',
        activity: [4, 6, 5, 8, 7, 9, 6, 11, 8, 7, 10, 9],
      }))
      setAgents(list)
    } catch (e: any) {
      setError(e?.message || 'Erreur exécution')
    } finally {
      setRunning((r) => ({ ...r, [agent.id]: false }))
    }
  }

  const stop = async (agent: Agent) => {
    try {
      setRunning((r) => ({ ...r, [agent.id]: true }))
      await api.agents.stop(agent.id)
      const res: any = await api.agents.list()
      const list = (res.data?.agents || []).map((a: any) => ({
        ...a,
        scope: 'Realtime',
        role: a.type || 'Agent',
        detected: 0,
        fixed: 0,
        lastAnalysis: a.last_run_at ? new Date(a.last_run_at).toLocaleTimeString() : '—',
        activity: [4, 6, 5, 8, 7, 9, 6, 11, 8, 7, 10, 9],
      }))
      setAgents(list)
    } catch (e: any) {
      setError(e?.message || 'Erreur arrêt')
    } finally {
      setRunning((r) => ({ ...r, [agent.id]: false }))
    }
  }

  return (
    <RequireSubscription>
      <PageHeader
        title="AI Agents"
        subtitle="Agents IA réels — exécutés via OpenRouter (avec fallback)"
        actions={
          <Link to="/app/automations">
            <Button variant="secondary">Configurer automations</Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line bg-surface px-4 py-3">
        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-ink">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-healthy opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-healthy" />
          </span>
          {agents.length > 0 ? 'Agents prêts' : 'Aucun agent'}
        </span>
        <span className="text-[13px] text-ink-muted">
          <span className="font-medium text-ink tabular-nums">{totalDetected}</span> problems detected
        </span>
        <span className="text-[13px] text-ink-muted">
          <span className="font-medium text-ink tabular-nums">{totalFixed}</span> fixes applied
        </span>
        {error && <span className="text-[13px] text-critical">{error}</span>}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <article
              key={agent.id}
              className="flex flex-col rounded-lg border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-pop"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-md border border-line bg-canvas font-mono text-base text-ink-soft">
                    {icons[agent.type as any] || '🤖'}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{agent.name}</h3>
                    <p className="text-[11px] text-ink-faint">{agent.scope}</p>
                  </div>
                </div>
                <StatusPill tone={agent.status === 'running' ? 'healthy' : agent.status === 'idle' ? 'neutral' : 'warning'}>
                  {agent.status}
                </StatusPill>
              </div>

              <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{agent.role}</p>

              <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
                <dl className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <dt className="text-ink-faint">Detected</dt>
                    <dd className="font-semibold text-ink tabular-nums">{agent.detected}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="text-ink-faint">Fixed</dt>
                    <dd className="font-semibold text-healthy tabular-nums">{agent.fixed}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="text-ink-faint">Last analysis</dt>
                    <dd className="font-medium text-ink-muted">{agent.lastAnalysis}</dd>
                  </div>
                </dl>
                <Sparkline data={agent.activity || []} tone="info" width={88} height={30} />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={running[agent.id] || agent.status === 'running'}
                    onClick={() => run(agent)}
                    className="gap-1.5"
                  >
                    <Play className="size-3.5" />
                    Exécuter
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={running[agent.id] || agent.status !== 'running'}
                    onClick={() => stop(agent)}
                    className="gap-1.5"
                  >
                    <Square className="size-3.5" />
                    Arrêter
                  </Button>
                </div>
                <Link to="/app/activity" className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-muted hover:text-ink">
                  Logs <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <Panel className="mt-5">
        <PanelHeader
          title={
            <span className="flex items-center gap-2">
              <Radio className="size-4 text-accent" />
              Agents IA
            </span>
          }
          subtitle="Réels via OpenRouter"
          action={
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-healthy">
              <Check className="size-3.5" />
              Opérationnel
            </span>
          }
        />
        <PanelBody>
          <p className="text-[13px] text-ink-muted">
            Agents exécutables en temps réel. Nécessite abonnement actif + clé OpenRouter sur Vercel.
          </p>
        </PanelBody>
      </Panel>
    </RequireSubscription>
  )
}
