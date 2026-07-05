import { useState } from 'react';
import { ref, push, set, remove, serverTimestamp } from 'firebase/database';
import { db } from '../../firebase';
import { useCollection } from '../../hooks/useCollection';
import { formatDateTime } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

export default function Announcements() {
  const { data: announcements } = useCollection('announcements');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const sorted = [...announcements].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  async function handlePost(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      const r = push(ref(db, 'announcements'));
      await set(r, { title: title.trim(), body: body.trim(), createdAt: serverTimestamp() });
      setTitle('');
      setBody('');
      setMessage('Posted — it now shows on every dashboard.');
    } catch (err) {
      setMessage(err.message || 'Could not post announcement.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this announcement?')) return;
    await remove(ref(db, `announcements/${id}`));
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Announcements</h1>
      <p className="text-ink-500 text-sm mt-1">
        Posted announcements appear at the top of every student, teacher, and librarian dashboard.
      </p>

      <form onSubmit={handlePost} className="catalog-card p-6 mt-6 max-w-xl space-y-4">
        <div>
          <label className="label">Title</label>
          <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="input" rows={3} required value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        {message && <p className="text-sm text-stacks-700">{message}</p>}
        <button className="btn-primary" disabled={busy} type="submit">
          {busy ? 'Posting…' : 'Post announcement'}
        </button>
      </form>

      <div className="catalog-card divide-y divide-ink-900/10 mt-6">
        {sorted.length === 0 && <p className="px-4 py-4 text-sm text-ink-500">No announcements yet.</p>}
        {sorted.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="font-display truncate">{a.title}</p>
              <p className="text-sm text-ink-700 mt-1">{a.body}</p>
              <p className="text-xs font-mono text-ink-500 mt-1">{formatDateTime(a.createdAt)}</p>
            </div>
            <button
              className="btn-ghost text-xs text-overdue-600 shrink-0"
              onClick={() => handleDelete(a.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
