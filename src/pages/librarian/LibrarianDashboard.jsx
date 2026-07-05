import { Link } from 'react-router-dom';
import { useCollection } from '../../hooks/useCollection';
import { isOverdue } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';
import AnnouncementBanner from '../../components/AnnouncementBanner';

export default function LibrarianDashboard() {
  const { data: books } = useCollection('books');
  const { data: records } = useCollection('borrowRecords');
  const { data: resources } = useCollection('resources');
  const { data: users } = useCollection('users');

  const activeBooks = books.filter((b) => !b.archived);
  const activeLoans = records.filter((r) => !r.returnedAt);
  const overdue = activeLoans.filter((r) => isOverdue(r.dueAt, r.returnedAt));
  const pendingResources = resources.filter((r) => r.status === 'pending');

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Library Overview</h1>
      <p className="text-ink-500 text-sm mt-1">Circulation, catalog, and account status at a glance.</p>

      <AnnouncementBanner />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Titles in catalog" value={activeBooks.length} to="/librarian/books" />
        <Stat label="Books checked out" value={activeLoans.length} to="/librarian/circulation" />
        <Stat label="Overdue" value={overdue.length} to="/librarian/overdue" alert={overdue.length > 0} />
        <Stat label="Resources pending" value={pendingResources.length} to="/librarian/resources" alert={pendingResources.length > 0} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <Link to="/librarian/circulation" className="catalog-card p-5 hover:shadow-md transition-shadow">
          <p className="font-display text-xl">Scan &amp; circulate →</p>
          <p className="text-sm text-ink-500 mt-1">Check books in/out with barcode/QR scanning.</p>
        </Link>
        <Link to="/librarian/users" className="catalog-card p-5 hover:shadow-md transition-shadow">
          <p className="font-display text-xl">Manage accounts →</p>
          <p className="text-sm text-ink-500 mt-1">{users.length} accounts total.</p>
        </Link>
        <Link to="/librarian/reports" className="catalog-card p-5 hover:shadow-md transition-shadow">
          <p className="font-display text-xl">Usage reports →</p>
          <p className="text-sm text-ink-500 mt-1">Borrowing trends and popular titles.</p>
        </Link>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, to, alert }) {
  return (
    <Link to={to} className={`catalog-card p-5 hover:shadow-md transition-shadow ${alert ? 'border-l-4 border-l-overdue-500' : ''}`}>
      <p className="font-mono text-xs uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`font-display text-4xl mt-1 ${alert ? 'text-overdue-600' : ''}`}>{value}</p>
    </Link>
  );
}
