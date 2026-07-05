import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import AppShell from '../../components/AppShell';
import AnnouncementBanner from '../../components/AnnouncementBanner';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const { data: resources } = useCollection('resources');
  const mine = resources.filter((r) => r.uploaderUid === profile.uid);
  const pending = mine.filter((r) => r.status === 'pending');
  const approved = mine.filter((r) => r.status === 'approved');

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Welcome back, {profile.name?.split(' ')[0]}</h1>
      <p className="text-ink-500 text-sm mt-1">Manage the learning materials you share with students.</p>

      <AnnouncementBanner />

      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Total uploads" value={mine.length} />
        <Stat label="Pending approval" value={pending.length} />
        <Stat label="Published" value={approved.length} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Link to="/teacher/upload" className="catalog-card p-5 hover:shadow-md transition-shadow">
          <p className="font-display text-xl">Upload a resource →</p>
          <p className="text-sm text-ink-500 mt-1">PDFs, notes, presentations, reviewers, e-books.</p>
        </Link>
        <Link to="/teacher/manage" className="catalog-card p-5 hover:shadow-md transition-shadow">
          <p className="font-display text-xl">Manage my resources →</p>
          <p className="text-sm text-ink-500 mt-1">Edit details or remove uploads.</p>
        </Link>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }) {
  return (
    <div className="catalog-card p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-500">{label}</p>
      <p className="font-display text-4xl mt-1">{value}</p>
    </div>
  );
}
