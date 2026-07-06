import { useState } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { createSchool, deleteSchool } from '../../utils/library';
import { ROLES } from '../../utils/roles';
import { formatDate } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

export default function ManageSchools() {
  const { data: schools } = useCollection('schools');
  const { data: users } = useCollection('users');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      await createSchool({ name: name.trim(), address: address.trim() });
      setName('');
      setAddress('');
    } catch (err) {
      setMessage(err.message || 'Could not add school.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm('Remove this school from the platform? Its users, books, and records are kept as-is.')) return;
    await deleteSchool(id, name);
  }

  function adminCount(schoolId) {
    return users.filter((u) => u.schoolId === schoolId && u.role === ROLES.LIBRARIAN).length;
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Schools</h1>
      <p className="text-ink-500 text-sm mt-1">
        Add school sites onto the platform, then assign admins to them from the Assign Admins tab.
      </p>

      <form onSubmit={handleAdd} className="catalog-card p-6 mt-6 max-w-xl space-y-4">
        <div>
          <label className="label">School name</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Address (optional)</label>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        {message && <p className="text-sm text-overdue-600">{message}</p>}
        <button className="btn-primary" disabled={busy} type="submit">
          {busy ? 'Adding…' : 'Add school'}
        </button>
      </form>

      <div className="catalog-card divide-y divide-ink-900/10 mt-6">
        {schools.length === 0 && <p className="px-4 py-4 text-sm text-ink-500">No schools yet.</p>}
        {schools.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="font-display truncate">{s.name}</p>
              <p className="text-xs text-ink-500">
                {s.address || 'No address on file'} · Added {formatDate(s.createdAt)} · {adminCount(s.id)} admin(s)
              </p>
            </div>
            <button
              className="btn-ghost text-xs text-overdue-600 shrink-0"
              onClick={() => handleDelete(s.id, s.name)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
