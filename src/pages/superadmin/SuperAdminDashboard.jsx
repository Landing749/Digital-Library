import { Link } from 'react-router-dom';
import { useCollection } from '../../hooks/useCollection';
import { ROLES } from '../../utils/roles';
import AppShell from '../../components/AppShell';

export default function SuperAdminDashboard() {
  const { data: schools } = useCollection('schools');
  const { data: users } = useCollection('users');

  const counts = {
    student: users.filter((u) => u.role === ROLES.STUDENT).length,
    teacher: users.filter((u) => u.role === ROLES.TEACHER).length,
    librarian: users.filter((u) => u.role === ROLES.LIBRARIAN).length
  };

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Platform Overview</h1>
      <p className="text-ink-500 text-sm mt-1">Manage schools and delegate library administration.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Stat label="Schools" value={schools.length} to="/superadmin/schools" />
        <Stat label="Students" value={counts.student} />
        <Stat label="Teachers" value={counts.teacher} />
        <Stat label="Librarians / Admins" value={counts.librarian} to="/superadmin/admins" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Link to="/superadmin/schools" className="catalog-card p-5">
          <p className="font-display text-xl">Manage schools →</p>
          <p className="text-sm text-ink-500 mt-1">Add new school sites onto the platform.</p>
        </Link>
        <Link to="/superadmin/admins" className="catalog-card p-5">
          <p className="font-display text-xl">Assign school admins →</p>
          <p className="text-sm text-ink-500 mt-1">Grant librarian/admin access from the user list.</p>
        </Link>
        <Link to="/superadmin/announcements" className="catalog-card p-5">
          <p className="font-display text-xl">Broadcast an announcement →</p>
          <p className="text-sm text-ink-500 mt-1">Post a notice to every dashboard, platform-wide.</p>
        </Link>
        <Link to="/superadmin/audit-log" className="catalog-card p-5">
          <p className="font-display text-xl">Review the audit log →</p>
          <p className="text-sm text-ink-500 mt-1">See recent admin actions across every school.</p>
        </Link>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, to }) {
  const inner = (
    <div className="catalog-card p-5 h-full">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-500">{label}</p>
      <p className="font-display text-4xl mt-1">{value}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}
