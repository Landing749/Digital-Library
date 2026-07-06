import { useState } from 'react';
import { ref, remove, update } from 'firebase/database';
import { Eye, Download, Star } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { formatDate } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

const STAMP = { pending: 'stamp-pending', approved: 'stamp-approved', rejected: 'stamp-rejected' };
const MATERIAL_TYPES = ['PDF', 'Notes', 'Presentation', 'Reviewer', 'E-book'];

export default function ManageResources() {
  const { profile } = useAuth();
  const { data: resources } = useCollection('resources');
  const { data: categories } = useCollection('categories');
  const [editing, setEditing] = useState(null);
  const mine = resources.filter((r) => r.uploaderUid === profile.uid).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  async function handleDelete(id) {
    if (!confirm('Remove this resource? This cannot be undone.')) return;
    await remove(ref(db, `resources/${id}`));
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl">My Resources</h1>
      <p className="text-ink-500 text-sm mt-1">Everything you've uploaded, its approval status, and how students are using it.</p>

      {mine.length === 0 ? (
        <p className="text-ink-500 text-sm mt-8">You haven't uploaded anything yet.</p>
      ) : (
        <div className="catalog-card divide-y divide-ink-900/10 mt-6">
          {mine.map((r) => (
            <ResourceRow key={r.id} resource={r} onEdit={() => setEditing(r)} onDelete={() => handleDelete(r.id)} />
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          resource={editing}
          categories={categories}
          onClose={() => setEditing(null)}
        />
      )}
    </AppShell>
  );
}

function ResourceRow({ resource: r, onEdit, onDelete }) {
  const { data: reviews } = useCollection(`reviews/res-${r.id}`);
  const avgRating = reviews.length ? reviews.reduce((sum, x) => sum + (x.rating || 0), 0) / reviews.length : 0;

  return (
    <div className="flex flex-wrap items-center justify-between px-4 py-3 gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-display truncate">{r.title}</p>
        <p className="text-xs text-ink-500">{r.subject} · {r.materialType} · {formatDate(r.createdAt)}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-500 font-mono">
          <span className="inline-flex items-center gap-1"><Eye size={13} /> {r.views || 0}</span>
          <span className="inline-flex items-center gap-1"><Download size={13} /> {r.downloads || 0}</span>
          {reviews.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star size={13} className="text-brass-600 fill-brass-500" /> {avgRating.toFixed(1)} ({reviews.length})
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={STAMP[r.status] || 'stamp-pending'}>{r.status}</span>
        <button onClick={onEdit} className="btn-ghost text-xs">Edit</button>
        <button onClick={onDelete} className="btn-ghost text-xs text-overdue-600">Delete</button>
      </div>
    </div>
  );
}

function EditModal({ resource, categories, onClose }) {
  const [form, setForm] = useState({
    title: resource.title,
    subject: resource.subject || '',
    categoryId: resource.categoryId || '',
    materialType: resource.materialType || 'PDF',
    description: resource.description || ''
  });
  const [busy, setBusy] = useState(false);

  function set_(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    try {
      // Only metadata fields are touched — status is never included here, so
      // this can't be used to sneak past the approval workflow.
      await update(ref(db, `resources/${resource.id}`), form);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/70 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={handleSave} onClick={(e) => e.stopPropagation()} className="catalog-card p-6 w-full max-w-lg space-y-4">
        <p className="font-display text-xl">Edit resource</p>
        <div>
          <label className="label">Title</label>
          <input className="input" required value={form.title} onChange={(e) => set_('title', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Subject</label>
            <input className="input" required value={form.subject} onChange={(e) => set_('subject', e.target.value)} />
          </div>
          <div>
            <label className="label">Material type</label>
            <select className="input" value={form.materialType} onChange={(e) => set_('materialType', e.target.value)}>
              {MATERIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.categoryId} onChange={(e) => set_('categoryId', e.target.value)}>
            <option value="">Uncategorized</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => set_('description', e.target.value)} />
        </div>
        <p className="text-xs text-ink-500">
          Editing keeps its current approval status ({resource.status}) — it won't need re-approval unless a librarian changes it.
        </p>
        <div className="flex gap-3">
          <button className="btn-primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save changes'}</button>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
