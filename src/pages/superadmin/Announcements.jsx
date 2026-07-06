import { useState } from 'react';
import { ref, push, set, remove, serverTimestamp } from 'firebase/database';
import { Megaphone } from 'lucide-react';
import { db } from '../../firebase';
import { useCollection } from '../../hooks/useCollection';
import { formatDateTime } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

// Reuses the same `announcements` node the librarian Announcements page
// writes to — a super admin broadcast and a school librarian's notice both
// show up in the same banner on every dashboard. A `scope` flag distinguishes
// platform-wide posts so they can be styled or filtered differently later.
export default function PlatformAnnouncements() {
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
      await set(r, { title: title.trim(), body: body.trim(), scope: 'platform', createdAt: serverTimestamp() });
      setTitle('');
      setBody('');
      setMessage('Broadcast to every school on the platform.');
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
      <div className="flex items-center gap-2.5">
        <Megaphone size={22} className="text-stacks-700" />
        <h1 className="font-display text-3xl">Platform Announcements</h1>
      </div>
      <p className="text-ink-500 text-sm mt-1">
        Broadcast a notice to every dashboard, across every school on the platform.
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
          {busy ? 'Broadcasting…' : 'Broadcast to all schools'}
        </button>
      </form>

      <div className="catalog-card divide-y divide-ink-900/10 mt-6">
        {sorted.length === 0 && <p className="px-4 py-4 text-sm text-ink-500">No announcements yet.</p>}
        {sorted.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="font-display truncate">
                {a.title} {a.scope === 'platform' && <span className="stamp-approved ml-1 align-middle">Platform</span>}
              </p>
              <p className="text-sm text-ink-700 mt-1">{a.body}</p>
              <p className="text-xs font-mono text-ink-500 mt-1">{formatDateTime(a.createdAt)}</p>
            </div>
            <button className="btn-ghost text-xs text-overdue-600 shrink-0" onClick={() => handleDelete(a.id)}>Delete</button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
