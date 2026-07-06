import { useMemo, useState } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { assignSchoolAdmin, setUserRole } from '../../utils/library';
import { ROLES, ROLE_LABEL } from '../../utils/roles';
import { formatDate } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

export default function AssignAdmins() {
  const { data: users } = useCollection('users');
  const { data: schools } = useCollection('schools');
  const [q, setQ] = useState('');
  const [schoolChoice, setSchoolChoice] = useState({});
  const [busyId, setBusyId] = useState(null);

  const candidates = useMemo(() => {
    return users
      .filter((u) => u.role !== ROLES.SUPERADMIN)
      .filter((u) => !q.trim() || `${u.name} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [users, q]);

  function schoolName(schoolId) {
    return schools.find((s) => s.id === schoolId)?.name;
  }

  async function handlePromote(u) {
    const schoolId = schoolChoice[u.id];
    if (!schoolId) {
      alert('Choose which school this admin belongs to first.');
      return;
    }
    setBusyId(u.id);
    try {
      await assignSchoolAdmin(u.id, schoolId, u.name, schoolName(schoolId));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDemote(u) {
    if (!confirm(`Remove admin access from ${u.name}? They'll become a teacher account.`)) return;
    setBusyId(u.id);
    try {
      await setUserRole(u.id, ROLES.TEACHER);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Assign School Admins</h1>
      <p className="text-ink-500 text-sm mt-1">
        Grant librarian/admin access to an existing account from the user list, tied to a school.
      </p>

      {schools.length === 0 && (
        <p className="text-sm text-overdue-600 mt-4">
          Add a school first from the Schools tab — you'll need one to assign an admin to.
        </p>
      )}

      <input
        className="input max-w-sm mt-6"
        placeholder="Search name or email…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="catalog-card divide-y divide-ink-900/10 mt-4">
        {candidates.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-display truncate">{u.name}</p>
              <p className="text-xs text-ink-500">
                {u.email} · {ROLE_LABEL[u.role]}
                {u.schoolId && ` · ${schoolName(u.schoolId) || 'Unknown school'}`} · Joined {formatDate(u.createdAt)}
              </p>
            </div>
            {u.role === ROLES.LIBRARIAN ? (
              <>
                <span className="stamp-approved">Admin</span>
                <button
                  disabled={busyId === u.id}
                  className="btn-ghost text-xs"
                  onClick={() => handleDemote(u)}
                >
                  Revoke
                </button>
              </>
            ) : (
              <>
                <select
                  className="input w-44"
                  value={schoolChoice[u.id] || ''}
                  onChange={(e) => setSchoolChoice((c) => ({ ...c, [u.id]: e.target.value }))}
                >
                  <option value="">Choose school…</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button
                  disabled={busyId === u.id || schools.length === 0}
                  className="btn-secondary text-xs"
                  onClick={() => handlePromote(u)}
                >
                  Make admin
                </button>
              </>
            )}
          </div>
        ))}
        {candidates.length === 0 && <p className="px-4 py-4 text-sm text-ink-500">No accounts match.</p>}
      </div>
    </AppShell>
  );
}
