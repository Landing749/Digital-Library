import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import BookCard from '../../components/BookCard';
import AppShell from '../../components/AppShell';

export default function Bookmarks() {
  const { profile } = useAuth();
  const { data: bookmarks } = useCollection(`bookmarks/${profile.uid}`);
  const { data: books } = useCollection('books');
  const { data: resources } = useCollection('resources');

  const items = bookmarks
    .map((bm) => {
      if (bm.id.startsWith('res-')) {
        const r = resources.find((x) => x.id === bm.id.replace('res-', ''));
        return r ? { ...r, type: 'digital', availableCopies: 1 } : null;
      }
      return books.find((b) => b.id === bm.id) || null;
    })
    .filter(Boolean);

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Bookmarks</h1>
      <p className="text-ink-500 text-sm mt-1">Your saved books and resources.</p>

      {items.length === 0 ? (
        <p className="text-ink-500 text-sm mt-8">No bookmarks yet — save something from Browse &amp; Search.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {items.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
      )}
    </AppShell>
  );
}
