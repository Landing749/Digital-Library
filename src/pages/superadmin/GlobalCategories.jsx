import { useState } from 'react';
import { Tags } from 'lucide-react';
import { useCollection } from '../../hooks/useCollection';
import { createGlobalCategory, deleteGlobalCategory } from '../../utils/library';
import AppShell from '../../components/AppShell';

// A master list of suggested category names. Librarians can import any of
// these into their own school's catalog in one click (see ManageCategories),
// which keeps naming consistent across schools without forcing it.
export default function GlobalCategories() {
  const { data: categories } = useCollection('globalCategories');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createGlobalCategory(name.trim());
      setName('');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this template? Categories already imported by schools are unaffected.')) return;
    await deleteGlobalCategory(id);
  }

  return (
    <AppShell>
      <div className="flex items-center gap-2.5">
        <Tags size={22} className="text-stacks-700" />
        <h1 className="font-display text-3xl">Global Category Templates</h1>
      </div>
      <p className="text-ink-500 text-sm mt-1">
        A shared starter list of subject categories every school's librarian can import into their own catalog.
      </p>

      <form onSubmit={handleAdd} className="flex gap-3 mt-6 max-w-md">
        <input className="input" placeholder="e.g. Mathematics, Fiction, Science" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary shrink-0" disabled={busy} type="submit">Add</button>
      </form>

      <div className="catalog-card divide-y divide-ink-900/10 mt-6 max-w-md">
        {sorted.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <p>{c.name}</p>
            <button className="btn-ghost text-xs text-overdue-600" onClick={() => handleDelete(c.id)}>Delete</button>
          </div>
        ))}
        {sorted.length === 0 && <p className="px-4 py-3 text-sm text-ink-500">No templates yet.</p>}
      </div>
    </AppShell>
  );
}
