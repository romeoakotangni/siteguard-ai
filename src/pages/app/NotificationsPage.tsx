import { Check, Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/app/AppLayout'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { StatusDot, StatusPill } from '../../components/ui/Status'
import { EmptyState } from '../../components/ui/Table'
import { useRealtime } from '../../lib/realtime'
import { cn } from '../../lib/utils'

export default function NotificationsPage() {
  const { notifications: items, markNotificationsRead, refreshing } = useRealtime()
  const unread = items.filter((n) => !n.read)

  const markAll = () => markNotificationsRead().catch(() => {})
  const markOne = (id: string) => markNotificationsRead(id).catch(() => {})

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={
          unread.length > 0
            ? `${unread.length} unread · agents report here between scans`
            : 'All caught up'
        }
        actions={
          <>
            <Button variant="secondary" onClick={markAll} disabled={unread.length === 0 || refreshing}>
              <Check className="size-4" />
              Mark all as read
            </Button>
            <Link to="/app/settings">
              <Button variant="secondary">Preferences</Button>
            </Link>
          </>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title="No notifications"
          description="Detections, approvals and reports will appear here."
        />
      ) : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-line">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  'flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-canvas',
                  !n.read && 'bg-accent-tint-soft',
                )}
              >
                <span className="mt-1.5">
                  <StatusDot tone={n.tone} pulse={!n.read} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    {!n.read && (
                      <span className="rounded-full bg-accent px-1.5 py-px text-[10px] font-semibold text-white">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-muted">{n.body}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-ink-faint">{n.time}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.read) markOne(n.id)
                    }}
                    disabled={n.read}
                    className="text-[13px] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100 hover:underline focus:opacity-100 disabled:opacity-0"
                  >
                    {n.read ? 'Read' : 'Mark read'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <StatusPill tone="healthy">All systems operational</StatusPill>
        <span className="text-[13px] text-ink-muted">
          Notification channels: email, Slack and webhook — configured in{' '}
          <Link to="/app/settings" className="font-medium text-accent hover:underline">
            Settings
          </Link>
        </span>
      </div>
    </>
  )
}
