import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useCollection } from '../../hooks/useCollection';
import { setUserRole, setUserStatus, bulkSetUserStatus } from '../../utils/library';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABEL, ROLES } from '../../utils/roles';
import { formatDate } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

export default function ManageUsers() {
  const { profile, role } = useAuth();
  const { data: users } = useCollection('users');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState(new Set());

  // Librarians only manage accounts at their own school; a super admin
  // visiting this page (e.g. while impersonating support) sees everyone.
  const scoped = useMemo(() => {
    if (role !== ROLES.LIBRARIAN) return users;
    return users.filter((u) => u.schoolId === profile.schoolId);
  }, [users, role, profile?.schoolId]);

  const visible = useMemo(() => {
    return scoped
      .filter((u) => u.role !== ROLES.SUPERADMIN)
      .filter((u) => (roleFilter === 'all' ? true : u.role === roleFilter))
      .filter((u) => !q.trim() || `${u.name} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase()));
  }, [scoped, roleFilter, q]);

  function toggleSelected(uid) {
    setSelected((cur) => {
      const next = new Set(cur);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((cur) => (cur.size === visible.length ? new Set() : new Set(visible.map((u) => u.id))));
  }

  async function handleBulkStatus(status) {
    const ids = [...selected].filter((uid) => uid !== profile.uid);
    if (ids.length === 0) return;
    if (!confirm(`${status === 'archived' ? 'Deactivate' : 'Reactivate'} ${ids.length} account(s)?`)) return;
    await bulkSetUserStatus(ids, status);
    setSelected(new Set());
  }

  function exportCsv() {
    const rows = [
      ['Name', 'Email', 'Role', 'Status', 'Joined'],
      ...visible.map((u) => [u.name, u.email, ROLE_LABEL[u.role] || u.role, u.status || 'active', formatDate(u.createdAt)])
    ];
    const csv = rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Manage Accounts</h1>
          <p className="text-ink-500 text-sm mt-1">
            Students and teachers register themselves — you assign librarian access and can deactivate accounts.
          </p>
        </div>
        <button className="btn-secondary text-sm" onClick={exportCsv}>
          <Download size={14} className="inline mr-1.5" />Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <input className="input flex-1 min-w-[200px]" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-48" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All roles</option>
          <option value={ROLES.STUDENT}>Students</option>
          <option value={ROLES.TEACHER}>Teachers</option>
          <option value={ROLES.LIBRARIAN}>Librarians</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 mt-4 catalog-card px-4 py-2.5">
          <p className="text-sm text-ink-700">{selected.size} selected</p>
          <button className="btn-ghost text-xs" onClick={() => handleBulkStatus('archived')}>Deactivate selected</button>
          <button className="btn-ghost text-xs" onClick={() => handleBulkStatus('active')}>Reactivate selected</button>
          <button className="btn-ghost text-xs ml-auto" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div className="catalog-card divide-y divide-ink-900/10 mt-4">
        {visible.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 text-xs text-ink-500">
            <input type="checkbox" checked={selected.size === visible.length} onChange={toggleSelectAll} />
            Select all
          </div>
        )}
        {visible.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <input
              type="checkbox"
              checked={selected.has(u.id)}
              disabled={u.id === profile.uid}
              onChange={() => toggleSelected(u.id)}
            />
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
