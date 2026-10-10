import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/Logo';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/app';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);

  if (loading) return null;

  if (user) return <Navigate to={from} replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingForm(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo />
          <h1 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink">Connexion</h1>
          <p className="text-sm text-ink-muted">Connectez-vous à votre espace</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Mot de passe</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p className="text-sm text-critical">{error}</p>}
          <Button className="w-full" type="submit" disabled={loadingForm}>
            {loadingForm ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
        <p className="text-center text-sm text-ink-muted">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-medium text-accent hover:text-accent-hover">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
