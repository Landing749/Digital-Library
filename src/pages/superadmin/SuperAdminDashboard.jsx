import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
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

  const activeSchools = schools.filter((s) => s.active !== false);
  const schoolsWithoutAdmin = activeSchools.filter(
    (s) => !users.some((u) => u.role === ROLES.LIBRARIAN && u.schoolId === s.id)
  );

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

      {schoolsWithoutAdmin.length > 0 && (
        <div className="catalog-card p-5 mt-6 border-l-4 border-l-overdue-500">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-overdue-600 shrink-0" />
            <p className="font-display text-lg">Schools without an admin</p>
          </div>
          <p className="text-sm text-ink-500 mt-1">
            These schools have no librarian/admin assigned yet — nobody can approve resources, run
            circulation, or manage accounts for them until you assign one.
          </p>
          <ul className="mt-3 space-y-1.5">
            {schoolsWithoutAdmin.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span>{s.name}</span>
                <Link to="/superadmin/admins" className="text-stacks-700 font-medium hover:underline text-xs">Assign admin →</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Link to="/superadmin/schools" className="catalog-card p-5 hover:shadow-md transition-shadow">
          <p className="font-display text-xl">Manage schools →</p>
          <p className="text-sm text-ink-500 mt-1">Add school sites and share their invite links.</p>
        </Link>
        <Link to="/superadmin/admins" className="catalog-card p-5 hover:shadow-md transition-shadow">
          <p className="font-display text-xl">Assign school admins →</p>
          <p className="text-sm text-ink-500 mt-1">Grant librarian/admin access from the user list.</p>
        </Link>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, to }) {
  const inner = (
    <div className="catalog-card p-5 hover:shadow-md transition-shadow h-full">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-500">{label}</p>
      <p className="font-display text-4xl mt-1">{value}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}
