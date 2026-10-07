import { Bell, Bot, Check, Globe, LayoutDashboard, Menu, Search, ShieldAlert, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { notifications, workspace } from '../../data/mock'
import { cn } from '../../lib/utils'
import { Logo } from '../Logo'
import { StatusDot } from '../ui/Status'

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md lg:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="flex size-8 items-center justify-center rounded-md text-ink-soft hover:bg-surface-muted lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-4.5" />
      </button>

      <Link to="/" className="lg:hidden">
        <Logo />
      </Link>

      <label className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          placeholder="Search sites, issues, agents…"
          className="h-8.5 w-full rounded-md border border-line bg-canvas pr-14 pl-8 text-[13px] text-ink placeholder:text-ink-faint focus:border-accent focus:bg-surface focus:outline-none"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-px font-sans text-[10px] font-medium text-ink-faint">
          ⌘K
        </kbd>
      </label>

      <div className="ml-auto flex items-center gap-1.5">
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex size-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface-muted"
            aria-label="Notifications"
          >
            <Bell className="size-4.5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-critical ring-2 ring-surface" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-line bg-surface shadow-pop animate-fade-in sm:w-96">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-sm font-semibold text-ink">Notifications</span>
                <Link
                  to="/app/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  View all
                </Link>
              </div>
              <ul className="max-h-80 divide-y divide-line overflow-y-auto scroll-thin">
                {notifications.slice(0, 4).map((n) => (
                  <li key={n.id} className="flex gap-3 px-4 py-3 hover:bg-canvas">
                    <span className="mt-1.5">
                      <StatusDot
                        tone={n.tone}
                        pulse={!n.read}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">{n.title}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">{n.body}</p>
                      <p className="mt-1 text-[11px] text-ink-faint">{n.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mx-1 hidden h-5 w-px bg-line sm:block" />

        <div className="hidden items-center gap-2 rounded-md border border-line px-2 py-1 sm:flex">
          <span className="flex size-5 items-center justify-center rounded bg-ink text-[9px] font-bold text-white">
            NA
          </span>
          <span className="text-[13px] font-medium text-ink">{workspace.name}</span>
        </div>

        <Link
          to="/app/settings"
          className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-muted"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-accent-tint text-[11px] font-semibold text-accent-hover">
            MD
          </span>
        </Link>
      </div>
    </header>
  )
}

export function MobileNav({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-ink/30 animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-72 bg-surface shadow-hero animate-fade-in">
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-ink-soft hover:bg-surface-muted"
            aria-label="Close navigation"
          >
            <X className="size-4.5" />
          </button>
        </div>
        <MobileNavLinks onNavigate={onClose} />
      </div>
    </div>
  )
}

const mobileLinks = [
  { to: '/app', label: 'Dashboard' },
  { to: '/app/websites', label: 'Websites' },
  { to: '/app/issues', label: 'Issues' },
  { to: '/app/agents', label: 'AI Agents' },
  { to: '/app/automations', label: 'Automations' },
  { to: '/app/reports', label: 'Reports' },
  { to: '/app/activity', label: 'Activity' },
  { to: '/app/notifications', label: 'Notifications' },
  { to: '/app/settings', label: 'Settings' },
  { to: '/app/billing', label: 'Billing' },
]

function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav className="space-y-0.5 p-3">
      {mobileLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-surface-muted hover:text-ink"
        >
          {link.label}
        </NavLink>
      ))}
      <div className="mt-3 flex items-center gap-2 border-t border-line px-3 pt-4">
        <Check className="size-4 text-healthy" />
        <span className="text-xs text-ink-muted">All systems operational</span>
      </div>
    </nav>
  )
}

export function BottomNav() {
  const items = [
    { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
    { to: '/app/websites', label: 'Sites', icon: Globe },
    { to: '/app/issues', label: 'Issues', icon: ShieldAlert },
    { to: '/app/agents', label: 'Agents', icon: Bot },
    { to: '/app/settings', label: 'More', icon: Menu },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 backdrop-blur md:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium',
              isActive ? 'text-accent' : 'text-ink-muted',
            )
          }
        >
          <item.icon className="size-4.5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
