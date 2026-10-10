import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRealtime } from '../../lib/realtime'
import { Button } from '../ui/Button'

export default function PaywallBanner() {
  const { paywall, clearPaywall } = useRealtime()
  if (!paywall) return null

  return (
    <div className="sticky top-14 z-40 flex items-center gap-3 border-b border-warning/30 bg-warning-tint px-4 py-2.5 text-[13px] text-ink">
      <p className="min-w-0 flex-1 truncate">{paywall.message}</p>
      <Link to="/app/billing" onClick={clearPaywall}>
        <Button size="sm">Passer à Pro</Button>
      </Link>
      <button
        type="button"
        onClick={clearPaywall}
        aria-label="Fermer"
        className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}