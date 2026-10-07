import {
  Activity,
  BadgeCheck,
  Bot,
  CreditCard,
  Globe,
  LayoutDashboard,
  Megaphone,
  Plug,
  Settings,
  ShieldAlert,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { overview, workspace } from '../../data/mock'
import { cn } from '../../lib/utils'
import { Logo } from '../Logo'

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/websites', label: 'Websites', icon: Globe },
  { to: '/app/issues', label: 'Issues', icon: ShieldAlert, badge: overview.issues },
  { to: '/app/agents', label: 'AI Agents', icon: Bot },
  { to: '/app/automations', label: 'Automations', icon: Plug },
  { to: '/app/reports', label: 'Reports', icon: Megaphone },
  { to: '/app/activity', label: 'Activity', icon: Activity },
]

const secondary = [{ to: '/app/settings', label: 'Settings', icon: Settings }]

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-14 items-center border-b border-line px-4">
        <NavLink to="/">
          <Logo />
        </NavLink>
      </div>

      <div className="px-3 pt-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md border border-line bg-canvas px-2.5 py-2 text-left transition-colors hover:border-line-strong"
        >
          <span className="flex size-6 items-center justify-center rounded bg-ink text-[10px] font-bold text-white">
            NA
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-ink">
              {workspace.name}
            </span>
            <span className="block text-[11px] text-ink-faint">{workspace.plan} plan</span>
          </span>
          <span className="text-ink-faint">⌄</span>
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 scroll-thin">
        {nav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <div className="mt-5 pt-3">
          <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
            Account
          </p>
          {secondary.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          <NavItem to="/app/billing" label="Billing" icon={CreditCard} />
        </div>
      </nav>

      <div className="border-t border-line p-3">
        <div className="rounded-md bg-canvas p-3">
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-4 text-healthy" />
            <span className="text-xs font-semibold text-ink">All systems operational</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">Last sweep 4 minutes ago</p>
        </div>
      </div>
    </aside>
  )
}

function NavItem({
  to,
  label,
  icon: Icon,
  badge,
  end,
}: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  badge?: number
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-accent-tint text-accent-hover'
            : 'text-ink-soft hover:bg-surface-muted hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('size-4', isActive ? 'text-accent' : 'text-ink-faint')} />
          <span className="flex-1">{label}</span>
          {badge ? (
            <span className="rounded-full bg-warning-tint px-1.5 py-px text-[11px] font-semibold text-warning tabular-nums">
              {badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}
