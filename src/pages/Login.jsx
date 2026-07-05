import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await loginWithEmail(email, password);
      navigate('/');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stacks-800 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display text-4xl text-parchment-50">Athenaeum</p>
          <p className="font-mono text-xs uppercase tracking-widest text-parchment-100/60 mt-1">
            School Digital Library
          </p>
        </div>

        <form onSubmit={handleSubmit} className="catalog-card p-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-overdue-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy} type="submit">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <div className="flex items-center gap-3 text-xs text-ink-500">
            <div className="h-px bg-ink-900/10 flex-1" /> or <div className="h-px bg-ink-900/10 flex-1" />
          </div>
          <button type="button" onClick={handleGoogle} className="btn-secondary w-full" disabled={busy}>
            Continue with Google
          </button>
          <p className="text-center text-sm text-ink-500">
            No account? <Link to="/register" className="text-stacks-700 font-medium">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function friendlyError(err) {
  const code = err?.code || '';
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Incorrect email or password.';
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again later.';
  if (code.includes('popup-closed')) return 'Sign-in was cancelled.';
  return 'Something went wrong. Please try again.';
}
