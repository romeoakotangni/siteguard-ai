import { Download, FileText, Mail, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/app/AppLayout'
import { Button } from '../../components/ui/Button'
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel'
import { StatusPill } from '../../components/ui/Status'
import { Table, Td, Th, Tr } from '../../components/ui/Table'

const reports = [
  { id: 'r1', name: 'October health report', scope: 'All websites', period: 'Oct 1 – Oct 7', status: 'Ready', size: '2.4 MB' },
  { id: 'r2', name: 'Acme Inc. — client report', scope: 'acme-studio.com', period: 'September', status: 'Sent', size: '860 KB' },
  { id: 'r3', name: 'Harbor Legal — incident summary', scope: 'harborlegal.com', period: 'Oct 6', status: 'Sent', size: '420 KB' },
  { id: 'r4', name: 'Core Web Vitals audit', scope: 'All websites', period: 'Q3 2026', status: 'Ready', size: '1.8 MB' },
  { id: 'r5', name: 'SEO technical audit', scope: '6 websites', period: 'September', status: 'Draft', size: '—' },
]

const schedule = [
  ['Weekly client report', 'Every Monday, 08:00', 'Email · 4 recipients'],
  ['Monthly executive summary', '1st of the month', 'Email · PDF + link'],
  ['Post-deploy verification', 'On every deploy', 'Slack #site-health'],
]

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Share proof of maintenance with your clients"
        actions={
          <>
            <Button variant="secondary">
              <Mail className="size-4" />
              Schedule report
            </Button>
            <Button>
              <Plus className="size-4" />
              Generate report
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Generated reports" subtitle="Last 30 days" />
          <div className="hidden sm:block">
            <Table>
              <thead>
                <tr>
                  <Th>Report</Th>
                  <Th>Scope</Th>
                  <Th>Period</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <Tr key={report.id}>
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-md border border-line bg-canvas text-ink-faint">
                          <FileText className="size-3.5" />
                        </span>
                        <span className="font-medium text-ink">{report.name}</span>
                      </span>
                    </Td>
                    <Td className="font-mono text-[13px] text-ink-muted">{report.scope}</Td>
                    <Td className="text-ink-muted">{report.period}</Td>
                    <Td>
                      <StatusPill
                        tone={
                          report.status === 'Ready'
                            ? 'healthy'
                            : report.status === 'Sent'
                              ? 'info'
                              : 'neutral'
                        }
                      >
                        {report.status}
                      </StatusPill>
                    </Td>
                    <Td className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="size-3.5" />
                        {report.size}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>

          <ul className="divide-y divide-line sm:hidden">
            {reports.map((report) => (
              <li key={report.id} className="px-4 py-3.5">
                <p className="text-sm font-medium text-ink">{report.name}</p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {report.scope} · {report.period}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <StatusPill
                    tone={
                      report.status === 'Ready' ? 'healthy' : report.status === 'Sent' ? 'info' : 'neutral'
                    }
                  >
                    {report.status}
                  </StatusPill>
                  <Button variant="ghost" size="sm">
                    <Download className="size-3.5" />
                    {report.size}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Scheduled deliveries" />
            <ul className="divide-y divide-line">
              {schedule.map(([name, when, how]) => (
                <li key={name} className="px-5 py-3.5">
                  <p className="text-[13px] font-medium text-ink">{name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{when}</p>
                  <p className="text-xs text-ink-faint">{how}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="Health trend" subtitle="Average across 24 sites" />
            <PanelBody>
              <div className="flex items-end gap-1.5">
                {[78, 80, 82, 81, 85, 86, 88, 89, 90, 92, 91, 94].map((h, i) => (
                  <div key={i} className="flex-1">
                    <div
                      className="rounded-sm bg-accent/80 transition-all"
                      style={{ height: `${h - 60}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-ink-faint">
                <span>Sep 8</span>
                <span>Oct 7</span>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelBody>
              <p className="text-sm font-semibold text-ink">White-label for clients</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                Add your logo and domain to every report with the Agency plan.
              </p>
              <Link to="/app/billing" className="mt-3 inline-block">
                <Button variant="secondary" size="sm">
                  View plans
                </Button>
              </Link>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  )
}
