import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/roles';

export default function Register() {
  const { registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: ROLES.STUDENT });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await registerWithEmail(form);
      navigate('/');
    } catch (err) {
      setError(err?.code?.includes('email-already-in-use') ? 'An account already exists for that email.' : 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stacks-800 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display text-4xl text-parchment-50">Athenaeum</p>
          <p className="font-mono text-xs uppercase tracking-widest text-parchment-100/60 mt-1">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="catalog-card p-6 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={form.password} onChange={(e) => set('password', e.target.value)} />
          </div>
          <div>
            <label className="label">I am a</label>
            <select className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
              <option value={ROLES.STUDENT}>Student</option>
              <option value={ROLES.TEACHER}>Teacher</option>
            </select>
            <p className="text-[11px] text-ink-500 mt-1">
              Librarian/admin and super admin accounts are created by an existing admin.
            </p>
          </div>
          {error && <p className="text-sm text-overdue-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy} type="submit">
            {busy ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-center text-sm text-ink-500">
            Already have an account? <Link to="/login" className="text-stacks-700 font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
