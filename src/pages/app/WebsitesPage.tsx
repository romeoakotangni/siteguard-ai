import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/app/AppLayout'
import { ScoreChip } from '../../components/ui/HealthGauge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusPill } from '../../components/ui/Status'
import { EmptyState, Table, Td, Th, Tr } from '../../components/ui/Table'
import { useRealtime, type SiteStatus } from '../../lib/realtime'
import { formatRelativeTime } from '../../lib/utils'

type Filter = 'all' | SiteStatus

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'healthy', label: 'Healthy' },
  { id: 'warning', label: 'Degraded' },
  { id: 'critical', label: 'Critical' },
]

export default function WebsitesPage() {
  const { websites, agents } = useRealtime()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const rows = useMemo(() => {
    return websites.filter((site) => {
      const matchesFilter = filter === 'all' || site.status === filter
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q || site.domain.toLowerCase().includes(q) || site.client.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [filter, query, websites])

  return (
    <>
      <PageHeader
        title="Websites"
        subtitle={`${websites.length} sites connected · monitored by ${agents.length} AI agents`}
        actions={
          <Link to="/onboarding">
            <Button>
              <Plus className="size-4" />
              Connecter mon premier site
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-md border border-line bg-surface p-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={
                filter === f.id
                  ? 'rounded bg-surface-muted px-2.5 py-1 text-[13px] font-medium text-ink'
                  : 'rounded px-2.5 py-1 text-[13px] font-medium text-ink-muted hover:text-ink'
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search domain or client"
              className="pl-8"
            />
          </label>
          <Button variant="secondary" size="md" aria-label="Filters">
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No websites match this view"
          description="Adjust the filters or connect a new client site to start monitoring."
          action={
            <Link to="/onboarding">
              <Button>Connecter mon premier site</Button>
            </Link>
          }
        />
      ) : (
        <Panel className="overflow-hidden">
          <div className="hidden md:block">
            <Table>
              <thead>
                <tr>
                  <Th>Website</Th>
                  <Th>Client</Th>
                  <Th>Health</Th>
                  <Th>Status</Th>
                  <Th>Critical</Th>
                  <Th>Warning</Th>
                  <Th>Uptime</Th>
                  <Th>Last scan</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((site) => (
                  <Tr key={site.id} onClick={() => navigate(`/app/websites/${site.id}`)}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-md border border-line bg-canvas text-[11px] font-semibold text-ink-muted">
                          {site.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-medium text-ink">{site.domain}</span>
                      </div>
                    </Td>
                    <Td className="text-ink-muted">{site.client}</Td>
                    <Td>
                      <ScoreChip score={site.health} />
                    </Td>
                    <Td>
                      <StatusPill tone={site.status} className="capitalize">
                        {site.status === 'healthy' ? 'Healthy' : site.status === 'warning' ? 'Degraded' : 'Critical'}
                      </StatusPill>
                    </Td>
                    <Td
                      className={
                        site.issues.critical > 0 ? 'font-semibold text-critical tabular-nums' : 'text-ink-faint tabular-nums'
                      }
                    >
                      {site.issues.critical}
                    </Td>
                    <Td
                      className={
                        site.issues.warning > 0 ? 'font-semibold text-warning tabular-nums' : 'text-ink-faint tabular-nums'
                      }
                    >
                      {site.issues.warning}
                    </Td>
                    <Td className="text-ink-muted tabular-nums">{site.uptime}</Td>
                    <Td className="text-ink-muted">{formatRelativeTime(site.lastScan)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>

          <ul className="divide-y divide-line md:hidden">
            {rows.map((site) => (
              <li key={site.id}>
                <Link to={`/app/websites/${site.id}`} className="block px-4 py-3.5 hover:bg-canvas">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{site.domain}</p>
                      <p className="truncate text-xs text-ink-faint">{site.client}</p>
                    </div>
                    <ScoreChip score={site.health} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <StatusPill tone={site.status} className="capitalize">
                      {site.status === 'healthy' ? 'Healthy' : site.status === 'warning' ? 'Degraded' : 'Critical'}
                    </StatusPill>
                    <span className="text-xs text-ink-faint">
                      {site.issues.critical} critical · {site.issues.warning} warning · {site.uptime}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  )
}
