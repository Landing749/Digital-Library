import { useMemo } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { isOverdue } from '../../utils/dateUtils';
import { ROLES } from '../../utils/roles';
import AppShell from '../../components/AppShell';

export default function PlatformReports() {
  const { data: schools } = useCollection('schools');
  const { data: users } = useCollection('users');
  const { data: books } = useCollection('books');
  const { data: records } = useCollection('borrowRecords');
  const { data: resources } = useCollection('resources');

  const stats = useMemo(() => {
    const byRole = {
      student: users.filter((u) => u.role === ROLES.STUDENT).length,
      teacher: users.filter((u) => u.role === ROLES.TEACHER).length,
      librarian: users.filter((u) => u.role === ROLES.LIBRARIAN).length
    };
    const activeLoans = records.filter((r) => !r.returnedAt).length;
    const overdue = records.filter((r) => !r.returnedAt && isOverdue(r.dueAt, r.returnedAt)).length;
    const returned = records.filter((r) => r.returnedAt).length;
    return { byRole, activeLoans, overdue, returned };
  }, [users, records]);

  const perSchool = useMemo(() => {
    return schools.map((s) => {
      const members = users.filter((u) => u.schoolId === s.id);
      return {
        id: s.id,
        name: s.name,
        active: s.active !== false,
        students: members.filter((u) => u.role === ROLES.STUDENT).length,
        teachers: members.filter((u) => u.role === ROLES.TEACHER).length,
        admins: members.filter((u) => u.role === ROLES.LIBRARIAN).length
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [schools, users]);

  function exportCsv() {
    const rows = [
      ['Metric', 'Value'],
      ['Schools', schools.length],
      ['Total accounts', users.length],
      ['Students', stats.byRole.student],
      ['Teachers', stats.byRole.teacher],
      ['Librarians / Admins', stats.byRole.librarian],
      ['Titles in catalog', books.filter((b) => !b.archived).length],
      ['Resources uploaded', resources.length],
      ['Total loans (all time)', records.length],
      ['Active loans', stats.activeLoans],
      ['Overdue loans', stats.overdue],
      [],
      ['School', 'Status', 'Students', 'Teachers', 'Admins'],
      ...perSchool.map((s) => [s.name, s.active ? 'active' : 'inactive', s.students, s.teachers, s.admins])
    ];
    const csv = rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Platform Reports</h1>
          <p className="text-ink-500 text-sm mt-1">Usage across every school on the platform.</p>
        </div>
        <button className="btn-secondary" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Stat label="Schools" value={schools.length} />
        <Stat label="Total accounts" value={users.length} />
        <Stat label="Titles in catalog" value={books.filter((b) => !b.archived).length} />
        <Stat label="Resources uploaded" value={resources.length} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <Stat label="Students" value={stats.byRole.student} />
        <Stat label="Teachers" value={stats.byRole.teacher} />
        <Stat label="Active loans" value={stats.activeLoans} />
        <Stat label="Overdue" value={stats.overdue} alert={stats.overdue > 0} />
      </div>

      <h2 className="font-display text-xl mt-8">By school</h2>
      <div className="catalog-card divide-y divide-ink-900/10 mt-3">
        {perSchool.length === 0 && <p className="px-4 py-4 text-sm text-ink-500">No schools yet.</p>}
        {perSchool.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-display truncate">{s.name}</p>
              {!s.active && <span className="stamp-overdue text-[10px]">Inactive</span>}
            </div>
            <p className="text-ink-500 text-xs">
              {s.students} student(s) · {s.teachers} teacher(s) · {s.admins} admin(s)
            </p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, alert }) {
  return (
    <div className="catalog-card p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`font-display text-4xl mt-1 ${alert ? 'text-overdue-600' : ''}`}>{value}</p>
    </div>
  );
}
