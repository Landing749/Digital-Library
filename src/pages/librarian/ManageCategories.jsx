import { useState } from 'react';
import { ref, push, set, remove, serverTimestamp } from 'firebase/database';
import { db } from '../../firebase';
import { useCollection } from '../../hooks/useCollection';
import AppShell from '../../components/AppShell';

export default function ManageCategories() {
  const { data: categories } = useCollection('categories');
  const { data: books } = useCollection('books');
  const [name, setName] = useState('');

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
