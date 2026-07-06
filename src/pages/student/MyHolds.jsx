import { Link } from 'react-router-dom';
import { Clock3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { cancelHold } from '../../utils/library';
import { formatDate } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

export default function MyHolds() {
  const { profile } = useAuth();
  const { data: books } = useCollection('books');
  const { data: holds } = useCollection('holds');

  const mine = holds.filter((h) => h.uid === profile.uid).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  function queuePosition(hold) {
    const sameBook = holds
      .filter((h) => h.bookId === hold.bookId)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    return sameBook.findIndex((h) => h.id === hold.id) + 1;
  }

  function isNowAvailable(bookId) {
    const book = books.find((b) => b.id === bookId);
    return book && (book.availableCopies ?? 0) > 0;
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl">My Holds</h1>
      <p className="text-ink-500 text-sm mt-1">Books you're waiting on, and your place in line.</p>

      <div className="catalog-card divide-y divide-ink-900/10 mt-6">
        {mine.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-500">
            No active holds. When a physical book is fully checked out, you can join its waitlist from the book's page.
          </p>
        )}
        {mine.map((h) => {
          const available = isNowAvailable(h.bookId);
          return (
            <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link to={`/book/${h.bookId}`} className="font-display hover:underline truncate block">{h.bookTitle}</Link>
                <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                  <Clock3 size={12} /> Requested {formatDate(h.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {available ? (
                  <span className="stamp-available">Available now</span>
                ) : (
                  <span className="font-mono text-xs text-ink-500">#{queuePosition(h)} in line</span>
                )}
                <button className="btn-ghost text-xs text-overdue-600" onClick={() => cancelHold(h.id)}>Cancel</button>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
