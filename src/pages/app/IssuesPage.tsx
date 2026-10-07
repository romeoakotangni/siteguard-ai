import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/app/AppLayout'
import { IssueChainCard } from '../../components/IssueChainCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusPill } from '../../components/ui/Status'
import { EmptyState } from '../../components/ui/Table'
import { issues as allIssues, websites } from '../../data/mock'

type View = 'open' | 'approval' | 'resolved' | 'all'

const views: { id: View; label: string }[] = [
  { id: 'approval', label: 'Waiting for approval' },
  { id: 'open', label: 'Open' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' },
]

export default function IssuesPage() {
  const [view, setView] = useState<View>('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allIssues.filter((issue) => {
      const matchesView = view === 'all' || issue.status === view
      const site = websites.find((w) => w.id === issue.siteId)
      const matchesQuery =
        !q ||
        issue.title.toLowerCase().includes(q) ||
        issue.path.toLowerCase().includes(q) ||
        (site?.domain ?? '').toLowerCase().includes(q)
      return matchesView && matchesQuery
    })
  }, [view, query])

  const counts = {
    approval: allIssues.filter((i) => i.status === 'approval').length,
    open: allIssues.filter((i) => i.status === 'open').length,
    resolved: allIssues.filter((i) => i.status === 'resolved').length,
    all: allIssues.length,
  }

  return (
    <>
      <PageHeader
        title="Issues"
        subtitle="Every problem detected by the AI team, with diagnosis and proposed fix"
        actions={
          <Link to="/onboarding">
            <Button>
              <Plus className="size-4" />
              Connecter mon premier site
            </Button>
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={
                view === v.id
                  ? 'rounded-md bg-ink px-3 py-1.5 text-[13px] font-medium text-white'
                  : 'rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-muted hover:text-ink'
              }
            >
              {v.label}
              <span className="ml-1.5 tabular-nums opacity-70">{counts[v.id]}</span>
            </button>
          ))}
        </div>

        <label className="relative lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-faint" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search issues, paths, domains"
            className="pl-8"
          />
        </label>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing to resolve here"
          description="No issues match this view. When an agent detects a problem, it will appear here with a diagnosis and a proposed fix."
          action={
            <Link to="/app">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {rows.map((issue) => {
            const site = websites.find((w) => w.id === issue.siteId)
            return (
              <div key={issue.id}>
                {issue.status === 'resolved' && (
                  <div className="mb-2 flex items-center gap-2">
                    <StatusPill tone="healthy">Resolved</StatusPill>
                    <span className="text-xs text-ink-muted">
                      Fix applied and verified by Monitor Agent
                    </span>
                  </div>
                )}
                <IssueChainCard issue={issue} siteDomain={site?.domain} />
              </div>
            )
          })}
        </div>
      )}

      <Panel className="mt-6">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Let AI handle the next one</p>
            <p className="text-[13px] text-ink-muted">
              Turn on auto-approval for safe fixes and verified corrections will be applied without
              waiting.
            </p>
          </div>
          <Link to="/app/automations">
            <Button variant="secondary">Configure automations</Button>
          </Link>
        </div>
      </Panel>
    </>
  )
}
