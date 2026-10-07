import { useAuth } from '../lib/auth';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';

export default function RequireSubscription({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const hasSub = false;

  if (!hasSub && user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">Abonnement requis</h2>
        <p className="max-w-md text-sm text-ink-muted">
          Vous devez être connecté et avoir un abonnement actif pour utiliser cet outil.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link to="/billing">
            <Button>Voir les plans</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
