import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import BookCard from '../../components/BookCard';
import AppShell from '../../components/AppShell';
import PageTransition from '../../components/PageTransition';
import EmptyState from '../../components/EmptyState';

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
      <PageTransition>
        <h1 className="font-display text-3xl">Bookmarks</h1>
        <p className="text-ink-500 text-sm mt-1">Your saved books and resources.</p>

        {items.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No bookmarks yet"
            hint="Save something from Browse & Search to find it here later."
            action={
              <Link to="/student/browse" className="btn-secondary mt-1">
                Browse the library <ArrowRight size={14} />
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
            {items.map((b, i) => <BookCard key={b.id} book={b} index={i} />)}
          </div>
        )}
      </PageTransition>
    </AppShell>
  );
}
