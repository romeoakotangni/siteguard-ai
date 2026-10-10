import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav, MobileNav, Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { ScrollProgress } from '../motion/ScrollProgress'
import { useRealtime } from '../../lib/realtime'

function LiveRefresh() {
  const { refresh } = useRealtime()
  const { pathname } = useLocation()

  useEffect(() => {
    const t = setTimeout(() => refresh().catch(() => {}), 120)
    return () => clearTimeout(t)
  }, [pathname, refresh])

  return null
}

export default function AppLayout() {
  const [mobileNav, setMobileNav] = useState(false)
  const location = useLocation()

  return (
    <>
      <LiveRefresh />
      <div className="flex min-h-screen bg-canvas">
        <ScrollProgress />
        <Sidebar />
        <MobileNav open={mobileNav} onClose={() => setMobileNav(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMobileNav={() => setMobileNav(true)} />
          <main
            key={location.pathname}
            className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-24 md:px-6 lg:pb-12 animate-fade-up"
          >
            <Outlet />
          </main>
          <BottomNav />
        </div>
      </div>
    </>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  breadcrumb?: React.ReactNode
}) {
  return (
    <div className="mb-6 animate-fade-up">
      {breadcrumb && <div className="mb-2 text-[13px] text-ink-muted">{breadcrumb}</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.015em] text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
