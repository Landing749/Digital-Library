import { useState } from 'react';
import { ref, push, set, remove, serverTimestamp } from 'firebase/database';
import { db } from '../../firebase';
import { useCollection } from '../../hooks/useCollection';
import { importGlobalCategory } from '../../utils/library';
import AppShell from '../../components/AppShell';

export default function ManageCategories() {
  const { data: categories } = useCollection('categories');
  const { data: books } = useCollection('books');
  const { data: globalCategories } = useCollection('globalCategories');
  const [name, setName] = useState('');
  const [importing, setImporting] = useState(null);

  const notYetImported = globalCategories.filter(
    (g) => !categories.some((c) => c.name.trim().toLowerCase() === g.name.trim().toLowerCase())
  );

  async function handleImport(g) {
    setImporting(g.id);
    try {
      await importGlobalCategory(g.name);
    } finally {
      setImporting(null);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const r = push(ref(db, 'categories'));
    await set(r, { name: name.trim(), createdAt: serverTimestamp() });
    setName('');
  }

  async function handleDelete(id) {
    const inUse = books.some((b) => b.categoryId === id);
    if (inUse && !confirm('Books are using this category. Delete anyway? They will show as "Uncategorized".')) return;
    await remove(ref(db, `categories/${id}`));
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Categories</h1>
      <p className="text-ink-500 text-sm mt-1">Used to organize books and learning materials.</p>

      <form onSubmit={handleAdd} className="flex gap-3 mt-6 max-w-md">
        <input className="input" placeholder="e.g. Mathematics, Fiction, Science" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary shrink-0" type="submit">Add</button>
      </form>

      {notYetImported.length > 0 && (
        <div className="mt-6 max-w-md">
          <p className="label mb-2">Suggested from the platform library</p>
          <div className="flex flex-wrap gap-2">
            {notYetImported.map((g) => (
              <button
                key={g.id}
                disabled={importing === g.id}
                onClick={() => handleImport(g)}
                className="text-xs font-mono px-2.5 py-1 rounded-full border border-stacks-700/30 text-stacks-700 hover:bg-stacks-700 hover:text-white transition-colors disabled:opacity-50"
              >
                + {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="catalog-card divide-y divide-ink-900/10 mt-6 max-w-md">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <p>{c.name}</p>
            <button className="btn-ghost text-xs text-overdue-600" onClick={() => handleDelete(c.id)}>Delete</button>
          </div>
        ))}
        {categories.length === 0 && <p className="px-4 py-3 text-sm text-ink-500">No categories yet.</p>}
      </div>
    </AppShell>
  );
}
