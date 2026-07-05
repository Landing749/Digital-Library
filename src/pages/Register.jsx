import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Library, GraduationCap, BookMarked, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { ROLES } from '../utils/roles';

export default function Register() {
  const { registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = (searchParams.get('school') || '').trim().toUpperCase();

  const { data: schools, loading: schoolsLoading } = useCollection('schools');
  const activeSchools = useMemo(() => schools.filter((s) => s.active !== false), [schools]);
  const invitedSchool = useMemo(
    () => (inviteCode ? activeSchools.find((s) => (s.joinCode || '').toUpperCase() === inviteCode) : null),
    [activeSchools, inviteCode]
  );

  const [form, setForm] = useState({ name: '', email: '', password: '', role: ROLES.STUDENT, schoolId: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Once the invited school resolves (or we know there's no match), lock it in.
  useEffect(() => {
    if (invitedSchool) set('schoolId', invitedSchool.id);
  }, [invitedSchool?.id]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const needsSchoolPicker = !schoolsLoading && !invitedSchool && activeSchools.length > 0;
  const invalidInvite = !schoolsLoading && inviteCode && !invitedSchool;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (needsSchoolPicker && !form.schoolId) {
      setError('Please choose your school.');
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
    <div className="min-h-screen flex bg-parchment-50">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-brass-500 to-stacks-600 text-parchment-50 shadow-md mb-3">
              <Library size={22} strokeWidth={2.25} />
            </div>
            <p className="font-display text-3xl text-ink-900">Digital Library</p>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-500 mt-1">Create your account</p>
          </div>

          <div className="hidden lg:block mb-8">
            <p className="font-display text-3xl text-ink-900">Create your account</p>
            <p className="text-sm text-ink-500 mt-1">Join your school's library, in a minute.</p>
          </div>

          <form onSubmit={handleSubmit} className="catalog-card p-6 space-y-4">
            {invitedSchool && (
              <div className="flex items-center gap-2 rounded-lg bg-brass-500/10 border border-brass-500/30 px-3 py-2.5">
                <CheckCircle2 size={16} className="text-brass-600 shrink-0" />
                <p className="text-sm text-ink-700">
                  Joining <span className="font-medium">{invitedSchool.name}</span>
                </p>
              </div>
            )}
            {invalidInvite && (
              <div className="flex items-start gap-2 rounded-lg bg-overdue-500/10 border border-overdue-500/30 px-3 py-2.5">
                <AlertTriangle size={16} className="text-overdue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-ink-700">
                  That invite link is invalid or no longer active. Choose your school below, or ask your librarian for a new link.
                </p>
              </div>
            )}
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
            {needsSchoolPicker && (
              <div>
                <label className="label">School</label>
                <select className="input" required value={form.schoolId} onChange={(e) => set('schoolId', e.target.value)}>
                  <option value="">Choose your school…</option>
                  {activeSchools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
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
              Already have an account? <Link to="/login" className="text-stacks-700 font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex w-[42%] shrink-0 relative flex-col justify-between overflow-hidden
                     bg-gradient-to-br from-stacks-800 via-stacks-700 to-stacks-800 text-parchment-50 p-12">
      <div className="absolute inset-0 bg-card-lines opacity-10 pointer-events-none" />
      <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-brass-500/10 blur-3xl" />
      <div className="absolute -left-16 bottom-0 w-64 h-64 rounded-full bg-parchment-50/5 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <span className="grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-brass-500 to-stacks-500 shadow-lg shrink-0">
          <Library size={22} strokeWidth={2.25} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-2xl">Digital Library</p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-parchment-100/60">School Library System</p>
        </div>
      </div>

      <div className="relative space-y-6">
        <p className="font-display text-4xl leading-tight max-w-sm">
          One account, every shelf.
        </p>
        <div className="space-y-3.5 text-sm text-parchment-100/85">
          <Feature icon={GraduationCap} text="Students & teachers get instant access to the catalog and resources." />
          <Feature icon={BookMarked} text="Bookmark titles, track reading history, and manage borrowed books." />
          <Feature icon={Sparkles} text="Teachers can upload notes, reviewers, and presentations for approval." />
        </div>
      </div>

      <p className="relative font-mono text-[11px] text-parchment-100/40">
        Realtime sync · Firebase &amp; Cloudinary
      </p>
    </div>
  );
}

function Feature({ icon: Icon, text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid place-items-center w-7 h-7 rounded-md bg-parchment-50/10 shrink-0 mt-0.5">
        <Icon size={15} strokeWidth={2} />
      </span>
      <p className="leading-snug">{text}</p>
    </div>
  );
}
