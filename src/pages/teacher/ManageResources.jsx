import { ref, remove } from 'firebase/database';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { formatDate } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

const STAMP = { pending: 'stamp-pending', approved: 'stamp-approved', rejected: 'stamp-rejected' };

export default function ManageResources() {
  const { profile } = useAuth();
  const { data: resources } = useCollection('resources');
  const mine = resources.filter((r) => r.uploaderUid === profile.uid).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  async function handleDelete(id) {
    if (!confirm('Remove this resource? This cannot be undone.')) return;
    await remove(ref(db, `resources/${id}`));
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl">My Resources</h1>
      <p className="text-ink-500 text-sm mt-1">Everything you've uploaded, and its approval status.</p>

      {mine.length === 0 ? (
        <p className="text-ink-500 text-sm mt-8">You haven't uploaded anything yet.</p>
      ) : (
        <div className="catalog-card divide-y divide-ink-900/10 mt-6">
          {mine.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="min-w-0">
                <p className="font-display truncate">{r.title}</p>
                <p className="text-xs text-ink-500">{r.subject} · {r.materialType} · {formatDate(r.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={STAMP[r.status] || 'stamp-pending'}>{r.status}</span>
                <button onClick={() => handleDelete(r.id)} className="btn-ghost text-overdue-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
