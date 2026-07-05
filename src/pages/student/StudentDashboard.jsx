import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import AppShell from '../../components/AppShell';
import AnnouncementBanner from '../../components/AnnouncementBanner';
import { formatDate, isOverdue } from '../../utils/dateUtils';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const { data: borrowRecords } = useCollection('borrowRecords');
  const mine = borrowRecords.filter((r) => r.userId === profile.uid);
  const active = mine.filter((r) => !r.returnedAt);
  const overdue = active.filter((r) => isOverdue(r.dueAt, r.returnedAt));

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Welcome back, {profile.name?.split(' ')[0]}</h1>
      <p className="text-ink-500 text-sm mt-1">Here's what's happening in your library.</p>

      <AnnouncementBanner />

      <div className="grid sm:grid-cols-3 gap-4 mt-2">
        <StatCard label="Books borrowed" value={active.length} to="/student/borrowing" />
        <StatCard label="Overdue" value={overdue.length} to="/student/borrowing" alert={overdue.length > 0} />
        <StatCard label="Bookmarks" value="" to="/student/bookmarks" hint="View saved items →" />
      </div>

      {overdue.length > 0 && (
        <div className="catalog-card border-l-4 border-l-overdue-500 p-4 mt-6">
          <p className="font-display text-lg text-overdue-600">You have overdue books</p>
          <ul className="text-sm mt-2 space-y-1">
            {overdue.map((r) => (
              <li key={r.id}>{r.bookTitle} — was due {formatDate(r.dueAt)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Link to="/student/browse" className="catalog-card p-5 hover:shadow-md transition-shadow">
          <p className="font-display text-xl">Browse the library →</p>
          <p className="text-sm text-ink-500 mt-1">Search books, PDFs, and teacher resources.</p>
        </Link>
        <Link to="/student/history" className="catalog-card p-5 hover:shadow-md transition-shadow">
          <p className="font-display text-xl">Continue reading →</p>
          <p className="text-sm text-ink-500 mt-1">Pick up where you left off.</p>
        </Link>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, to, hint, alert }) {
  return (
    <Link to={to} className={`catalog-card p-5 hover:shadow-md transition-shadow ${alert ? 'border-l-4 border-l-overdue-500' : ''}`}>
      <p className="font-mono text-xs uppercase tracking-wide text-ink-500">{label}</p>
      {value !== '' ? <p className={`font-display text-4xl mt-1 ${alert ? 'text-overdue-600' : ''}`}>{value}</p> : <p className="text-sm text-ink-500 mt-2">{hint}</p>}
    </Link>
  );
}
