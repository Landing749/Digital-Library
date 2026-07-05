import { useMemo, useState } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { setUserRole, setUserStatus } from '../../utils/library';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABEL, ROLES } from '../../utils/roles';
import { formatDate } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

export default function ManageUsers() {
  const { profile } = useAuth();
  const { data: users } = useCollection('users');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const visible = useMemo(() => {
    return users
      .filter((u) => u.role !== ROLES.SUPERADMIN)
      .filter((u) => (roleFilter === 'all' ? true : u.role === roleFilter))
      .filter((u) => !q.trim() || `${u.name} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase()));
  }, [users, roleFilter, q]);

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Manage Accounts</h1>
      <p className="text-ink-500 text-sm mt-1">
        Students and teachers register themselves — you assign librarian access and can deactivate accounts.
      </p>

      <div className="flex flex-wrap gap-3 mt-6">
        <input className="input flex-1 min-w-[200px]" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-48" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All roles</option>
          <option value={ROLES.STUDENT}>Students</option>
          <option value={ROLES.TEACHER}>Teachers</option>
          <option value={ROLES.LIBRARIAN}>Librarians</option>
        </select>
      </div>

      <div className="catalog-card divide-y divide-ink-900/10 mt-6">
        {visible.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-display truncate">{u.name} {u.id === profile.uid && <span className="text-xs text-ink-500">(you)</span>}</p>
              <p className="text-xs text-ink-500">{u.email} · Joined {formatDate(u.createdAt)}</p>
            </div>
            <select
              className="input w-40"
              value={u.role}
              disabled={u.id === profile.uid}
              onChange={(e) => setUserRole(u.id, e.target.value)}
            >
              <option value={ROLES.STUDENT}>{ROLE_LABEL[ROLES.STUDENT]}</option>
              <option value={ROLES.TEACHER}>{ROLE_LABEL[ROLES.TEACHER]}</option>
              <option value={ROLES.LIBRARIAN}>{ROLE_LABEL[ROLES.LIBRARIAN]}</option>
            </select>
            <span className={u.status === 'archived' ? 'stamp-overdue' : 'stamp-available'}>{u.status || 'active'}</span>
            <button
              disabled={u.id === profile.uid}
              className="btn-ghost text-xs disabled:opacity-30"
              onClick={() => setUserStatus(u.id, u.status === 'archived' ? 'active' : 'archived')}
            >
              {u.status === 'archived' ? 'Reactivate' : 'Deactivate'}
            </button>
          </div>
        ))}
        {visible.length === 0 && <p className="px-4 py-4 text-sm text-ink-500">No accounts match.</p>}
      </div>
    </AppShell>
  );
}
