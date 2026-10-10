import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { useRealtime } from '../lib/realtime';

export default function RequireSubscription({ children }: { children: React.ReactNode }) {
  const { subscription } = useRealtime();

  const entitled = subscription && (subscription.status === 'active' || subscription.status === 'trial');

  if (!entitled) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">Réservé aux abonnés Pro</h2>
        <p className="max-w-md text-sm text-ink-muted">
          Cette fonctionnalité est incluse dans les plans Pro et Agency.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link to="/app/billing">
            <Button>Voir les plans</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}