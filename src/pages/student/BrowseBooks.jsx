import { useMemo, useState } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { searchBooks, filterByCategory } from '../../utils/search';
import BookCard from '../../components/BookCard';
import AppShell from '../../components/AppShell';

export default function BrowseBooks() {
  const { data: books, loading: loadingBooks } = useCollection('books');
  const { data: resources } = useCollection('resources');
  const { data: categories } = useCollection('categories');
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [tab, setTab] = useState('books');

  const activeBooks = useMemo(() => books.filter((b) => !b.archived), [books]);
  const approvedResources = useMemo(
    () => resources.filter((r) => r.status === 'approved').map((r) => ({ ...r, type: 'digital', availableCopies: 1 })),
    [resources]
  );

  const source = tab === 'books' ? activeBooks : approvedResources;
  const filtered = searchBooks(filterByCategory(source, categoryId), q);

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Browse &amp; Search</h1>
      <p className="text-ink-500 text-sm mt-1">Search by title, author, subject, ISBN, or keyword.</p>

      <div className="flex flex-wrap gap-3 mt-6">
        <div className="flex bg-parchment-100 rounded-sm p-1 border border-ink-900/10">
          <button onClick={() => setTab('books')} className={`px-3 py-1.5 text-sm rounded-sm ${tab === 'books' ? 'bg-stacks-700 text-white' : 'text-ink-700'}`}>Library Books</button>
          <button onClick={() => setTab('resources')} className={`px-3 py-1.5 text-sm rounded-sm ${tab === 'resources' ? 'bg-stacks-700 text-white' : 'text-ink-700'}`}>Teacher Resources</button>
        </div>
        <input
          className="input flex-1 min-w-[200px]"
          placeholder="Search title, author, ISBN, subject…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input w-48" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loadingBooks ? (
        <p className="text-ink-500 font-mono text-sm mt-8">Pulling the catalog drawer…</p>
      ) : filtered.length === 0 ? (
        <p className="text-ink-500 text-sm mt-8">Nothing matches that search yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {filtered.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
      )}
    </AppShell>
  );
}
