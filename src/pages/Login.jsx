import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Library, BookOpen, ScanLine, Users, ArrowRight, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen flex bg-parchment-50">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center px-4 py-12 lg:py-4">
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
            <p className="font-mono text-xs uppercase tracking-widest text-ink-500 mt-1">
              School Library System
            </p>
          </div>

          <div className="hidden lg:block mb-8">
            <p className="font-display text-3xl text-ink-900">Welcome back</p>
            <p className="text-sm text-ink-500 mt-1">Sign in to your library account.</p>
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
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-overdue-600"
              >
                {error}
              </motion.p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full group"
              disabled={busy}
              type="submit"
            >
              {busy ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></>
              )}
            </motion.button>
            <div className="flex items-center gap-3 text-xs text-ink-500">
              <div className="h-px bg-ink-900/10 flex-1" /> or <div className="h-px bg-ink-900/10 flex-1" />
            </div>
            <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={handleGoogle} className="btn-secondary w-full" disabled={busy}>
              Continue with Google
            </motion.button>
            <p className="text-center text-sm text-ink-500">
              No account? <Link to="/register" className="text-stacks-700 font-medium hover:underline">Register</Link>
            </p>
          </form>
        </motion.div>
      </div>
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

      {/* Ambient floating glyphs — a quiet nod to a shelf catalog, not literal illustration */}
      <BookOpen size={20} strokeWidth={1.5} className="absolute top-24 right-16 text-parchment-50/10 float-slow" />
      <ScanLine size={26} strokeWidth={1.5} className="absolute bottom-40 right-28 text-parchment-50/10 float-slow-delay" />
      <Library size={18} strokeWidth={1.5} className="absolute top-1/2 right-10 text-parchment-50/10 float-slow-delay-2" />

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
          Every book, resource, and borrower — in one place.
        </motion.p>
        <div className="space-y-3.5 text-sm text-parchment-100/85">
          <Feature icon={BookOpen} text="Read PDFs and e-books online, or download for later." delay={0.2} />
          <Feature icon={ScanLine} text="QR/barcode scanning for fast physical book check-in and check-out." delay={0.28} />
          <Feature icon={Users} text="Role-based access for students, teachers, and librarians." delay={0.36} />
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

function friendlyError(err) {
  const code = err?.code || '';
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Incorrect email or password.';
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again later.';
  if (code.includes('popup-closed')) return 'Sign-in was cancelled.';
  return 'Something went wrong. Please try again.';
}
