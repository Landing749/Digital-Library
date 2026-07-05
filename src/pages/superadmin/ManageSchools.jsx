import { useState } from 'react';
import { Copy, Check, RefreshCw, Pencil, X, Users } from 'lucide-react';
import { useCollection } from '../../hooks/useCollection';
import {
  createSchool, deleteSchool, updateSchool, regenerateJoinCode, setSchoolActive, buildJoinLink
} from '../../utils/library';
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
  const [editingId, setEditingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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

  async function handleDelete(id) {
    if (!confirm('Permanently remove this school from the platform? Its users, books, and records are kept as-is, but the school entry and its invite link go away for good. Consider deactivating instead.')) return;
    await deleteSchool(id);
  }

  async function handleCopyLink(school) {
    const link = buildJoinLink(school.joinCode);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(school.id);
      setTimeout(() => setCopiedId((cur) => (cur === school.id ? null : cur)), 2000);
    } catch {
      window.prompt('Copy this invite link:', link);
    }
  }

  async function handleRegenerate(school) {
    if (!confirm(`Generate a new invite link for ${school.name}? The old link will stop working.`)) return;
    await regenerateJoinCode(school.id);
  }

  function memberCounts(schoolId) {
    const members = users.filter((u) => u.schoolId === schoolId);
    return {
      students: members.filter((u) => u.role === ROLES.STUDENT).length,
      teachers: members.filter((u) => u.role === ROLES.TEACHER).length,
      admins: members.filter((u) => u.role === ROLES.LIBRARIAN).length
    };
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Schools</h1>
      <p className="text-ink-500 text-sm mt-1">
        Add school sites onto the platform, share each one's invite link so students/teachers can register
        under the right school, then assign admins from the Assign Admins tab.
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

      <div className="space-y-3 mt-6">
        {schools.length === 0 && <p className="catalog-card px-4 py-4 text-sm text-ink-500">No schools yet.</p>}
        {schools.map((s) => (
          <SchoolRow
            key={s.id}
            school={s}
            counts={memberCounts(s.id)}
            editing={editingId === s.id}
            onEdit={() => setEditingId(s.id)}
            onCancelEdit={() => setEditingId(null)}
            onSave={async (fields) => {
              await updateSchool(s.id, fields);
              setEditingId(null);
            }}
            onDelete={() => handleDelete(s.id)}
            onCopyLink={() => handleCopyLink(s)}
            copied={copiedId === s.id}
            onRegenerate={() => handleRegenerate(s)}
            onToggleActive={() => setSchoolActive(s.id, s.active === false)}
          />
        ))}
      </div>
    </AppShell>
  );
}

function SchoolRow({
  school, counts, editing, onEdit, onCancelEdit, onSave, onDelete, onCopyLink, copied, onRegenerate, onToggleActive
}) {
  const [name, setName] = useState(school.name);
  const [address, setAddress] = useState(school.address || '');
  const inactive = school.active === false;
  const link = buildJoinLink(school.joinCode);

  if (editing) {
    return (
      <div className="catalog-card p-4 space-y-3">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="School name" />
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
        <div className="flex gap-2">
          <button className="btn-primary text-xs" onClick={() => onSave({ name: name.trim(), address: address.trim() })}>Save</button>
          <button className="btn-ghost text-xs" onClick={onCancelEdit}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`catalog-card p-4 ${inactive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display truncate">{school.name}</p>
            {inactive && <span className="stamp-overdue text-[10px]">Inactive</span>}
          </div>
          <p className="text-xs text-ink-500 mt-0.5">
            {school.address || 'No address on file'} · Added {formatDate(school.createdAt)}
          </p>
          <p className="text-xs text-ink-500 mt-1 flex items-center gap-1">
            <Users size={12} /> {counts.students} student(s) · {counts.teachers} teacher(s) · {counts.admins} admin(s)
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="btn-ghost text-xs" onClick={onEdit}><Pencil size={13} className="inline mr-1" />Edit</button>
          <button className="btn-ghost text-xs" onClick={onToggleActive}>{inactive ? 'Reactivate' : 'Deactivate'}</button>
          <button className="btn-ghost text-xs text-overdue-600" onClick={onDelete}><X size={13} className="inline mr-1" />Remove</button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 bg-parchment-100/60 rounded-lg px-3 py-2 flex-wrap">
        <p className="font-mono text-xs text-ink-700 truncate flex-1 min-w-[180px]">{link}</p>
        <button className="btn-secondary text-xs shrink-0" onClick={onCopyLink}>
          {copied ? <><Check size={13} className="inline mr-1" />Copied</> : <><Copy size={13} className="inline mr-1" />Copy invite link</>}
        </button>
        <button className="btn-ghost text-xs shrink-0" onClick={onRegenerate}>
          <RefreshCw size={13} className="inline mr-1" />New code
        </button>
      </div>
    </div>
  );
}
