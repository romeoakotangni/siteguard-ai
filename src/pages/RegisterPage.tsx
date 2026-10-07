import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/Logo';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/app');
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo />
          <h1 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink">Créer un compte</h1>
          <p className="text-sm text-ink-muted">Inscrivez-vous pour commencer</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Nom complet</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Mot de passe</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={8} required />
          </div>
          {error && <p className="text-sm text-critical">{error}</p>}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'Création…' : "S'inscrire"}
          </Button>
        </form>
        <p className="text-center text-sm text-ink-muted">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
