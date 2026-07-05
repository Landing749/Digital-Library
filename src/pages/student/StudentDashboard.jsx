import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, Sunrise, BookOpen, AlertTriangle, Bookmark, Search, History, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import AppShell from '../../components/AppShell';
import PageTransition from '../../components/PageTransition';
import AnnouncementBanner from '../../components/AnnouncementBanner';
import AnimatedCounter from '../../components/AnimatedCounter';
import { formatDate, isOverdue } from '../../utils/dateUtils';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', icon: Sunrise };
  if (h < 18) return { text: 'Good afternoon', icon: Sun };
  return { text: 'Good evening', icon: Moon };
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const { data: borrowRecords } = useCollection('borrowRecords');
  const mine = borrowRecords.filter((r) => r.userId === profile.uid);
  const active = mine.filter((r) => !r.returnedAt);
  const overdue = active.filter((r) => isOverdue(r.dueAt, r.returnedAt));
  const { text: greetText, icon: GreetIcon } = greeting();

  return (
    <AppShell>
      <PageTransition>
        <div className="flex items-center gap-2 text-brass-600">
          <GreetIcon size={18} strokeWidth={2} />
          <span className="font-mono text-xs uppercase tracking-widest">{greetText}</span>
        </div>
        <h1 className="font-display text-3xl mt-1">Welcome back, {profile.name?.split(' ')[0]}</h1>
        <p className="text-ink-500 text-sm mt-1">Here's what's happening in your library.</p>

        <div className="mt-6">
          <AnnouncementBanner />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="Books borrowed" value={active.length} to="/student/borrowing" icon={BookOpen} />
          <StatCard label="Overdue" value={overdue.length} to="/student/borrowing" icon={AlertTriangle} alert={overdue.length > 0} />
          <StatCard label="Bookmarks" to="/student/bookmarks" icon={Bookmark} hint="View saved items" />
        </div>

        {overdue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="catalog-card border-l-4 border-l-overdue-500 p-4 mt-6"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-overdue-600" strokeWidth={2.25} />
              <p className="font-display text-lg text-overdue-600">You have overdue books</p>
            </div>
            <ul className="text-sm mt-2 space-y-1">
              {overdue.map((r) => (
                <li key={r.id}>{r.bookTitle} — was due {formatDate(r.dueAt)}</li>
              ))}
            </ul>
          </motion.div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <QuickAction to="/student/browse" icon={Search} title="Browse the library" hint="Search books, PDFs, and teacher resources." />
          <QuickAction to="/student/history" icon={History} title="Continue reading" hint="Pick up where you left off." />
        </div>
      </PageTransition>
    </AppShell>
  );
}

function StatCard({ label, value, to, hint, alert, icon: Icon }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
      <Link to={to} className={`catalog-card p-5 flex items-start gap-3 hover:shadow-md transition-shadow ${alert ? 'border-l-4 border-l-overdue-500' : ''}`}>
        <span className={`icon-badge w-9 h-9 shrink-0 ${alert ? 'bg-overdue-500/10 text-overdue-600' : 'bg-stacks-700/10 text-stacks-700'}`}>
          <Icon size={17} strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-wide text-ink-500">{label}</p>
          {value !== undefined ? (
            <p className={`font-display text-4xl mt-1 leading-none ${alert ? 'text-overdue-600' : ''}`}>
              <AnimatedCounter value={value} />
            </p>
          ) : (
            <p className="text-sm text-ink-500 mt-2 flex items-center gap-1">{hint} <ArrowRight size={13} /></p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function QuickAction({ to, icon: Icon, title, hint }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
      <Link to={to} className="catalog-card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
        <span className="icon-badge w-11 h-11 bg-gradient-to-br from-brass-500 to-stacks-600 text-parchment-50 shrink-0 group-hover:scale-105">
          <Icon size={19} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl flex items-center gap-1.5">
            {title} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </p>
          <p className="text-sm text-ink-500 mt-1">{hint}</p>
        </div>
      </Link>
    </motion.div>
  );
}
