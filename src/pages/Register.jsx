import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Library, GraduationCap, BookMarked, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen flex bg-parchment-50">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
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
              <RoleToggle value={form.role} onChange={(v) => set('role', v)} />
              <p className="text-[11px] text-ink-500 mt-1.5">
                Librarian/admin and super admin accounts are created by an existing admin.
              </p>
            </div>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-overdue-600">
                {error}
              </motion.p>
            )}
            <motion.button whileTap={{ scale: 0.97 }} className="btn-primary w-full group" disabled={busy} type="submit">
              {busy ? (
                <><Loader2 size={16} className="animate-spin" /> Creating account…</>
              ) : (
                <>Create account <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></>
              )}
            </motion.button>
            <p className="text-center text-sm text-ink-500">
              Already have an account? <Link to="/login" className="text-stacks-700 font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function RoleToggle({ value, onChange }) {
  const options = [
    { value: ROLES.STUDENT, label: 'Student', icon: GraduationCap },
    { value: ROLES.TEACHER, label: 'Teacher', icon: BookMarked }
  ];
  return (
    <div className="tab-pill-track">
      {options.map(({ value: v, label, icon: Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`tab-pill-btn flex-1 flex items-center justify-center gap-1.5 ${active ? 'text-white' : 'text-ink-700'}`}
          >
            {active && (
              <motion.span
                layoutId="role-pill"
                className="absolute inset-0 bg-stacks-700 rounded-md -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <Icon size={14} strokeWidth={2} /> {label}
          </button>
        );
      })}
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex w-[42%] shrink-0 relative flex-col justify-between overflow-hidden
                     bg-gradient-to-br from-stacks-800 via-stacks-700 to-stacks-800 text-parchment-50 p-12">
      <div className="absolute inset-0 bg-card-lines opacity-10 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-brass-500/10 blur-3xl"
      />
      <div className="absolute -left-16 bottom-0 w-64 h-64 rounded-full bg-parchment-50/5 blur-3xl" />

      <GraduationCap size={22} strokeWidth={1.5} className="absolute top-28 right-14 text-parchment-50/10 float-slow" />
      <Sparkles size={18} strokeWidth={1.5} className="absolute bottom-44 right-24 text-parchment-50/10 float-slow-delay" />
      <BookMarked size={20} strokeWidth={1.5} className="absolute top-1/2 right-8 text-parchment-50/10 float-slow-delay-2" />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex items-center gap-3"
      >
        <span className="grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-brass-500 to-stacks-500 shadow-lg shrink-0">
          <Library size={22} strokeWidth={2.25} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-2xl">Digital Library</p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-parchment-100/60">School Library System</p>
        </div>
      </motion.div>

      <div className="relative space-y-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-4xl leading-tight max-w-sm"
        >
          One account, every shelf.
        </motion.p>
        <div className="space-y-3.5 text-sm text-parchment-100/85">
          <Feature icon={GraduationCap} text="Students & teachers get instant access to the catalog and resources." delay={0.2} />
          <Feature icon={BookMarked} text="Bookmark titles, track reading history, and manage borrowed books." delay={0.28} />
          <Feature icon={Sparkles} text="Teachers can upload notes, reviewers, and presentations for approval." delay={0.36} />
        </div>
      </div>

      <p className="relative font-mono text-[11px] text-parchment-100/40">
        Realtime sync · Firebase &amp; Cloudinary
      </p>
    </div>
  );
}

function Feature({ icon: Icon, text, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-start gap-3"
    >
      <span className="grid place-items-center w-7 h-7 rounded-md bg-parchment-50/10 shrink-0 mt-0.5">
        <Icon size={15} strokeWidth={2} />
      </span>
      <p className="leading-snug">{text}</p>
    </motion.div>
  );
}
