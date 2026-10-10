import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from './api'
import { formatRelativeTime } from './utils'

export type Severity = 'critical' | 'warning' | 'optimization'
export type IssueStatus = 'open' | 'approval' | 'resolved' | 'ignored'
export type SiteStatus = 'healthy' | 'warning' | 'critical'

export interface Website {
  id: string
  domain: string
  name: string
  client: string
  health: number
  status: SiteStatus
  issues: { critical: number; warning: number; optimization: number }
  lastScan: string
  uptime: string
  responseMs: number
  plan: 'Starter' | 'Pro' | 'Agency'
  connectedAt: string
}

export interface IssueTimelineStep {
  time: string
  agent: string
  label: string
  state: 'done' | 'current' | 'pending'
}

export interface Issue {
  id: string
  code: string
  title: string
  severity: Severity
  status: IssueStatus
  siteId: string
  path: string
  category: 'Monitoring' | 'Performance' | 'SEO' | 'Forms' | 'Security' | 'Content'
  impact: 'High' | 'Medium' | 'Low'
  detectedAt: string
  detectedBy: string
  diagnosis: string
  evidence: { label: string; value: string }[]
  recommendedFix: string
  fixDetail: string
  confidence: number
  before: { label: string; value: string; tone: 'critical' | 'healthy' }
  after: { label: string; value: string; tone: 'critical' | 'healthy' }
  affectedPages: number
  seoImpact: 'High' | 'Medium' | 'Low' | 'None'
  timeline: IssueTimelineStep[]
  autoFixable: boolean
  patch?: { file?: string; change?: string; before?: string; after?: string; instructions?: string; generatedBy?: string } | null
}

export interface ActivityEvent {
  id: string
  time: string
  agent: string
  message: string
  kind: 'detect' | 'diagnose' | 'fix' | 'approve' | 'verify' | 'info'
  site?: string
}

export interface Notification {
  id: string
  title: string
  body: string
  time: string
  tone: 'critical' | 'warning' | 'healthy' | 'info'
  read: boolean
}

interface Plan {
  id: string
  name: string
  price: string
  priceCfa: number
  period: string
  description: string
  features: string[]
  cta: string
  highlighted: boolean
}

interface WorkspaceInfo {
  name: string
  plan: string
  user: { name: string; email: string; role: string }
}

interface Overview {
  websites: number
  healthy: number
  issues: number
  approvals: number
  healthScore: number
  trend: string
  metrics: { label: string; value: string; percent: number; tone: 'neutral' | 'healthy' | 'warning' | 'critical'; hint: string }[]
}

interface Subscription {
  status: string
  planCode: string
  planName: string
  priceCfa: number
  periodEnd: string | null
  trialEndsAt: string | null
  cancelAtPeriodEnd: boolean
  provider: string
}

interface UsageInfo {
  websites: number
  websitesMax: number
  scans: number
  openIssues: number
  resolved: number
}

export interface Realtime {
  loaded: boolean
  refreshing: boolean
  workspace: WorkspaceInfo
  websites: Website[]
  issues: Issue[]
  approvals: Issue[]
  notifications: Notification[]
  activity: ActivityEvent[]
  overview: Overview
  pricingPlans: Plan[]
  agents: any[]
  automations: any[]
subscription: Subscription | null
    payments: any[]
    usage: UsageInfo | null
    paywall: { message: string } | null
    lastScan: { websiteId: string; ok: boolean; message: string } | null
  getSite: (id: string) => Website | undefined
  getIssue: (id: string) => Issue | undefined
  siteIssues: (siteId: string) => Issue[]
  refresh: () => Promise<void>
  clearPaywall: () => void
  connectWebsite: (input: { url: string; name?: string; client?: string }) => Promise<any>
  scanWebsite: (websiteId: string) => Promise<any>
  deleteWebsite: (websiteId: string) => Promise<any>
  updateIssueStatus: (issueId: string, status: string) => Promise<any>
  generateFix: (issueId: string) => Promise<any>
  markNotificationsRead: (id?: string) => Promise<any>
  toggleAutomation: (id: string, enabled: boolean) => Promise<any>
  subscribe: (planCode: string) => Promise<any>
  updateProfile: (name: string) => Promise<any>
}

/* ------------------------------------------------------------------ */

function mapSiteStatus(s: string): SiteStatus {
  if (s === 'healthy') return 'healthy'
  if (s === 'warning' || s === 'pending' || s === 'scanning') return 'warning'
  return 'critical'
}

function mapSeverity(s: string): Severity {
  if (s === 'critical') return 'critical'
  if (s === 'high' || s === 'medium') return 'warning'
  return 'optimization'
}

function mapStatus(s: string): IssueStatus {
  if (s === 'open') return 'open'
  if (s === 'in_progress') return 'approval'
  if (s === 'ignored') return 'ignored'
  return 'resolved'
}

function mapTone(t: string): Notification['tone'] {
  if (t === 'critical') return 'critical'
  if (t === 'warning') return 'warning'
  if (t === 'success') return 'healthy'
  return 'info'
}

function shortCode(id: string) {
  const clean = String(id || '').replace(/-/g, '')
  return `#${(clean.slice(0, 4) || 'ISSUE').toUpperCase()}`
}

function toWebsite(row: any, issues: Issue[]): Website {
  const sev = { critical: 0, warning: 0, optimization: 0 }
  for (const i of issues) if (i.siteId === row.id) sev[i.severity] += 1
  const total = Number(row.scan_count) || 0
  const ok = Number(row.scan_ok) || 0
  const uptime = total ? `${((ok / total) * 100).toFixed(2)}%` : '—'
  return {
    id: row.id,
    domain: row.domain,
    name: row.name || row.domain,
    client: row.client || '',
    health: Number(row.health_score) || 0,
    status: mapSiteStatus(row.status),
    issues: sev,
    lastScan: row.last_scan_at || row.created_at,
    uptime,
    responseMs: Number(row.response_ms) || 0,
    plan: (row.plan || 'Starter') as Website['plan'],
    connectedAt: row.connected_at || row.created_at,
  }
}

function toIssue(row: any): Issue {
  const p = row.payload || {}
  return {
    id: row.id,
    code: p.code || shortCode(row.id),
    title: row.title,
    severity: mapSeverity(row.severity),
    status: mapStatus(row.status),
    siteId: row.website_id,
    path: row.path || '/',
    category: row.category || 'Monitoring',
    impact: p.impact || 'Medium',
    detectedAt: row.detected_at,
    detectedBy: row.detected_by || 'Monitor Agent',
    diagnosis: p.diagnosis || row.description || 'Detected during automated audit.',
    evidence: p.evidence || [],
    recommendedFix: p.recommendedFix || row.suggestion || 'Apply the recommended correction.',
    fixDetail: p.fixDetail || '',
    confidence: typeof p.confidence === 'number' ? p.confidence : 80,
    before: p.before || { label: 'Before', value: 'not healthy', tone: 'critical' },
    after: p.after || { label: 'After', value: 'healthy', tone: 'healthy' },
    affectedPages: p.affectedPages ?? 1,
    seoImpact: p.seoImpact || 'None',
    timeline: p.timeline || [],
    autoFixable: Boolean(row.auto_fixable),
    patch: p.patch || null,
  }
}

function toNotification(row: any): Notification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    time: formatRelativeTime(row.created_at),
    tone: mapTone(row.type),
    read: Boolean(row.read_at),
  }
}

function toPlan(row: any, current: string | null, index: number): Plan {
  const byCode: Record<string, { desc: string; features: string[] }> = {
    starter: {
      desc: 'For freelancers watching a handful of sites.',
      features: ['1 website', 'Monitor + SEO + Form agents', 'Daily scans', 'AI diagnosis', '10 auto-fixes / month'],
    },
    pro: {
      desc: 'For agencies that need fixes, not just alerts.',
      features: ['50 websites', 'All 6 AI agents', 'Hourly scans + deploy watch', 'Approval workflow & automations', 'Unlimited auto-fixes', 'Weekly client reports'],
    },
    agency: {
      desc: 'For teams running 50 to 100 client sites.',
      features: ['100 websites', 'All agents + custom rules', 'Minute-level monitoring', 'White-label reports', 'Roles, SSO & audit log', 'Priority support'],
    },
  }
  const meta = byCode[row.code] || { desc: '', features: [] }
  const cfa = Number(row.price_cfa) || 0
  const price = cfa >= 1000 ? `${(cfa / 1000).toFixed(0)} 000` : String(cfa)
  return {
    id: row.code,
    name: row.name,
    price,
    priceCfa: cfa,
    period: '/month',
    description: meta.desc,
    features: meta.features,
    cta: 'Choisir ce plan',
    highlighted: row.code === current && index !== 0 ? true : row.code === current,
  }
}

function buildWorkspace(me: any, billing: any): WorkspaceInfo {
  const sub = billing?.subscription
  const plan = sub?.status === 'trial' ? `Essai ${sub.planName || 'Pro'}` : sub?.planName || 'Starter'
  return {
    name: me?.workspace?.name || 'My Workspace',
    plan,
    user: { name: me?.user?.name || '', email: me?.user?.email || '', role: 'Owner' },
  }
}

function emptyOverview(): Overview {
  const metric = () => ({ label: '', value: '—', percent: 0, tone: 'neutral' as const, hint: '-' })
  return {
    websites: 0, healthy: 0, issues: 0, approvals: 0, healthScore: 0, trend: '—',
    metrics: [metric(), metric(), metric(), metric(), metric()],
  }
}

/* ------------------------------------------------------------------ */

const Ctx = createContext<Realtime | null>(null)

export function useRealtime(): Realtime {
  const v = useContext(Ctx)
  if (!v) throw new Error('RealtimeProvider missing — wrap the app tree with <RealtimeProvider>.')
  return v
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const enabled = pathname.startsWith('/app') || pathname === '/onboarding'
  const [state, setState] = useState<{
    loaded: boolean
    refreshing: boolean
    workspace: WorkspaceInfo
    websites: Website[]
    issues: Issue[]
    notifications: Notification[]
    activity: ActivityEvent[]
    overview: Overview
    pricingPlans: Plan[]
    agents: any[]
    automations: any[]
    subscription: Subscription | null
    payments: any[]
    usage: UsageInfo | null
    paywall: { message: string } | null
    lastScan: Realtime['lastScan']
  }>({
    loaded: false,
    refreshing: false,
    workspace: { name: 'Workspace', plan: 'Starter', user: { name: '', email: '', role: 'Owner' } },
    websites: [],
    issues: [],
    notifications: [],
    activity: [],
    overview: emptyOverview(),
    pricingPlans: [],
    agents: [],
    automations: [],
    subscription: null,
    payments: [],
    usage: null,
    paywall: null,
    lastScan: null,
  })

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, refreshing: s.loaded }))
    const results = await Promise.allSettled([
      api.auth.me(),
      api.checkout.plans(),
      api.websites.list(),
      api.issues.list(),
      api.notifications.list(),
      api.dashboard.overview(),
      api.dashboard.activity(),
      api.billing.summary(),
      api.agents.list(),
      api.automations.list(),
    ])
    const [me, plans, sites, iss, notifs, ov, act, billing, agents, automations] = results.map((r) => (r.status === 'fulfilled' ? r.value : null))

    const issuesArr: Issue[] = ((iss?.issues as any[]) || []).map(toIssue)
    const websites: Website[] = ((sites?.websites as any[]) || []).map((w) => toWebsite(w, issuesArr))
    const notifications: Notification[] = ((notifs?.notifications as any[]) || []).map(toNotification).slice(0, 60)
    const activity: ActivityEvent[] = ((act?.activity as any[]) || []).map((e) => ({ ...e, time: formatRelativeTime(e.time) }))
    const subscription: Subscription | null = billing?.subscription ?? null
    const pricingPlans: Plan[] = ((plans?.plans as any[]) || []).map((p, i) => toPlan(p, subscription?.planCode || null, i))

    setState((s) => ({
      ...s,
      loaded: true,
      refreshing: false,
      workspace: buildWorkspace(me, billing),
      websites,
      issues: issuesArr,
      notifications,
      activity,
      overview: ov || emptyOverview(),
      pricingPlans,
      subscription,
      payments: billing?.payments || [],
      usage: billing?.usage || null,
      agents: agents?.agents || [],
      automations: automations?.automations || [],
    }))
  }, [])

  useEffect(() => {
    if (!enabled) return
    refresh().catch(() => setState((s) => ({ ...s, loaded: true, refreshing: false })))
  }, [enabled, refresh])

  const getSite = useCallback((id: string) => state.websites.find((w) => w.id === id), [state.websites])
  const getIssue = useCallback((id: string) => state.issues.find((i) => i.id === id), [state.issues])
  const siteIssues = useCallback((siteId: string) => state.issues.filter((i) => i.siteId === siteId), [state.issues])

  const markPaywall = useCallback((e: any) => {
    if (e && (e.upgrade || (e.status === 402 || e.status === 429))) {
      setState((s) => ({ ...s, paywall: { message: e.message || 'Passez à Pro pour débloquer cette fonctionnalité.' } }))
    }
  }, [])

  const guard = useCallback(async (fn: () => Promise<any>) => {
    try {
      const r = await fn()
      await refresh()
      return r
    } catch (e: any) {
      markPaywall(e)
      throw e
    }
  }, [markPaywall, refresh])

  const connectWebsite = useCallback(async (input: { url: string; name?: string; client?: string }) => guard(() => api.websites.create(input)), [guard])

  const scanWebsite = useCallback(async (websiteId: string) => {
    setState((s) => ({ ...s, refreshing: true }))
    try {
      const r = await api.websites.scan(websiteId)
      setState((s) => ({ ...s, lastScan: { websiteId, ok: true, message: (r as any)?.scan?.findings?.length ? `${(r as any).scan.findings.length} issues found` : 'Scan completed' } }))
      await refresh()
      return r
    } catch (e: any) {
      setState((s) => ({ ...s, lastScan: { websiteId, ok: false, message: e?.message || 'Scan failed' } }))
      markPaywall(e)
      await refresh()
      throw e
    }
  }, [refresh, markPaywall])

  const deleteWebsite = useCallback(async (websiteId: string) => guard(() => api.websites.delete(websiteId)), [guard])

  const updateIssueStatus = useCallback(async (issueId: string, status: string) => guard(() => api.issues.update({ issueId, status })), [guard])

const generateFix = useCallback(async (issueId: string) => {
    const r = await guard(() => api.issues.fix({ issueId }))
    await refresh()
    return r
  }, [guard, refresh])

  const markNotificationsRead = useCallback(async (id?: string) => {
    const r = await api.notifications.read(id)
    await refresh()
    return r
  }, [refresh])

  const toggleAutomation = useCallback(async (id: string, enabled: boolean) => guard(() => api.automations.update({ id, enabled })), [guard])

  const subscribe = useCallback(async (planCode: string) => guard(() => api.checkout.subscribe({ plan_code: planCode })), [guard])

  const updateProfile = useCallback(async (name: string) => {
    const r = await api.users.profile({ name })
    await refresh()
    return r
  }, [refresh])

  const clearPaywall = useCallback(() => setState((s) => ({ ...s, paywall: null })), [])

  const value = useMemo<Realtime>(
    () => ({
      ...state,
      approvals: state.issues.filter((i) => i.status === 'approval'),
      getSite,
      getIssue,
      siteIssues,
      refresh,
      clearPaywall,
      connectWebsite,
      scanWebsite,
      deleteWebsite,
      updateIssueStatus,
      generateFix,
      markNotificationsRead,
      toggleAutomation,
      subscribe,
      updateProfile,
    }),
    [state, getSite, getIssue, siteIssues, refresh, clearPaywall, connectWebsite, scanWebsite, deleteWebsite, updateIssueStatus, generateFix, markNotificationsRead, toggleAutomation, subscribe, updateProfile],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}