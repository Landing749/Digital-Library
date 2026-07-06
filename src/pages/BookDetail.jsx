import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDoc, useCollection } from '../hooks/useCollection';
import { toggleBookmark, logReadingHistory, borrowBook, submitReview, removeReview, placeHold, cancelHold } from '../utils/library';
import { formatDate } from '../utils/dateUtils';
import AppShell from '../components/AppShell';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const book = useDoc(`books/${id}`);
  const bookmarkDoc = useDoc(`bookmarks/${profile?.uid}/${id}`);
  const { data: categories } = useCollection('categories');
  const { data: reviews } = useCollection(`reviews/${id}`);
  const { data: allHolds } = useCollection('holds');
  const [borrowMsg, setBorrowMsg] = useState('');
  const [showReader, setShowReader] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');

  useEffect(() => {
    const mine = reviews.find((r) => r.id === profile?.uid);
    if (mine) {
      setMyRating(mine.rating);
      setMyComment(mine.comment || '');
    }
  }, [reviews, profile?.uid]);

  if (book === undefined) {
    return (
      <AppShell>
        <p className="text-ink-500 font-mono text-sm">Loading catalog record…</p>
      </AppShell>
    );
  }
  if (book === null) {
    return (
      <AppShell>
        <p className="text-overdue-600">This item couldn't be found — it may have been archived.</p>
      </AppShell>
    );
  }

  const category = categories.find((c) => c.id === book.categoryId);
  const isBookmarked = !!bookmarkDoc;
  const isPhysical = book.type === 'physical' || book.type === 'both';
  const isDigital = book.type === 'digital' || book.type === 'both';
  const available = (book.availableCopies ?? 0) > 0;

  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0;
  const myReview = reviews.find((r) => r.id === profile?.uid);
  const bookHolds = allHolds.filter((h) => h.bookId === id).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const myHold = bookHolds.find((h) => h.uid === profile?.uid);

  async function handleBookmark() {
    await toggleBookmark(profile.uid, id, isBookmarked);
  }

  async function handleRead() {
    setShowReader(true);
    await logReadingHistory(profile.uid, id, { title: book.title, coverUrl: book.coverUrl || null });
  }

  async function handleBorrow() {
    setBorrowMsg('');
    try {
      await borrowBook(book, profile.uid);
      setBorrowMsg('Borrowed! Check "My Borrowing" for your due date.');
    } catch (err) {
      setBorrowMsg(err.message || 'Could not borrow this book.');
    }
  }

  async function handleHold() {
    setBorrowMsg('');
    try {
      await placeHold(book, profile.uid, profile.name);
      setBorrowMsg("You're on the waitlist — we'll show your place in line here.");
    } catch (err) {
      setBorrowMsg(err.message || 'Could not place a hold.');
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!myRating) return;
    await submitReview(id, profile.uid, { rating: myRating, userName: profile.name, comment: myComment });
  }

  return (
    <AppShell>
      <button onClick={() => navigate(-1)} className="text-xs font-mono uppercase tracking-wide text-ink-500 hover:text-stacks-700">← Back</button>

      <div className="mt-4 grid md:grid-cols-[220px_1fr] gap-8">
        <div className="catalog-card aspect-[3/4] overflow-hidden">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display text-6xl text-ink-500/30">
              {book.title?.[0]}
            </div>
          )}
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-500">{category?.name || book.subject || 'General'}</p>
          <h1 className="font-display text-3xl mt-1">{book.title}</h1>
          <p className="text-ink-500 mt-1">by {book.author}</p>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {isPhysical && <span className={available ? 'stamp-available' : 'stamp-borrowed'}>{available ? `${book.availableCopies} of ${book.totalCopies} in stacks` : 'All copies checked out'}</span>}
            {isDigital && <span className="stamp-approved">Digital copy available</span>}
            {reviews.length > 0 && (
              <span className="inline-flex items-center gap-1 text-sm text-ink-700">
                <Star size={15} className="text-brass-600 fill-brass-500" strokeWidth={1.5} />
                {avgRating.toFixed(1)} <span className="text-ink-500">({reviews.length})</span>
              </span>
            )}
            {isPhysical && !available && bookHolds.length > 0 && (
              <span className="font-mono text-[11px] text-ink-500">{bookHolds.length} waiting</span>
            )}
          </div>

          <p className="text-sm text-ink-700 mt-5 leading-relaxed max-w-2xl">{book.description || 'No description provided yet.'}</p>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6 max-w-md font-mono text-xs">
            <div><dt className="text-ink-500">ISBN</dt><dd>{book.isbn || '—'}</dd></div>
            <div><dt className="text-ink-500">Subject</dt><dd>{book.subject || '—'}</dd></div>
            <div><dt className="text-ink-500">Added</dt><dd>{formatDate(book.createdAt)}</dd></div>
            <div><dt className="text-ink-500">Call No.</dt><dd>{book.id.slice(0, 8).toUpperCase()}</dd></div>
          </dl>

          <div className="flex flex-wrap gap-3 mt-7">
            {isDigital && book.fileUrl && (
              <button onClick={handleRead} className="btn-primary">Read online</button>
            )}
            {isDigital && book.fileUrl && (
              <a href={book.fileUrl} download className="btn-secondary">Download</a>
            )}
            {isPhysical && available && (
              <button onClick={handleBorrow} className="btn-secondary">Borrow this copy</button>
            )}
            {isPhysical && !available && !myHold && (
              <button onClick={handleHold} className="btn-secondary">Join waitlist</button>
            )}
            {isPhysical && myHold && (
              <button onClick={() => cancelHold(myHold.id)} className="btn-ghost text-overdue-600">
                Leave waitlist (#{bookHolds.findIndex((h) => h.id === myHold.id) + 1} in line)
              </button>
            )}
            <button onClick={handleBookmark} className="btn-ghost">
              {isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
            </button>
          </div>
          {borrowMsg && <p className="text-sm text-stacks-700 mt-3">{borrowMsg}</p>}
        </div>
      </div>

      <div className="mt-10 max-w-2xl">
        <h2 className="font-display text-xl">Ratings &amp; reviews</h2>

        <form onSubmit={handleReviewSubmit} className="catalog-card p-4 mt-3 space-y-3">
          <div>
            <label className="label">{myReview ? 'Update your rating' : 'Rate this book'}</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMyRating(n)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Star size={22} strokeWidth={1.5} className={n <= myRating ? 'text-brass-600 fill-brass-500' : 'text-ink-500/30'} />
                </button>
              ))}
            </div>
          </div>
          <textarea
            className="input"
            rows={2}
            maxLength={1000}
            placeholder="Optional comment…"
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
          />
          <div className="flex gap-3">
            <button className="btn-primary" type="submit" disabled={!myRating}>
              {myReview ? 'Update review' : 'Submit review'}
            </button>
            {myReview && (
              <button
                type="button"
                className="btn-ghost text-overdue-600"
                onClick={() => { removeReview(id, profile.uid); setMyRating(0); setMyComment(''); }}
              >
                Remove my review
              </button>
            )}
          </div>
        </form>

        <div className="catalog-card divide-y divide-ink-900/10 mt-4">
          {reviews.length === 0 && <p className="px-4 py-4 text-sm text-ink-500">No reviews yet — be the first.</p>}
          {[...reviews].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map((r) => (
            <div key={r.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{r.userName}</p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={13} strokeWidth={1.5} className={n <= r.rating ? 'text-brass-600 fill-brass-500' : 'text-ink-500/25'} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-ink-700 mt-1">{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>

      {showReader && book.fileUrl && (
        <div className="fixed inset-0 z-50 bg-ink-900/80 flex items-center justify-center p-4 md:p-10">
          <div className="bg-parchment-50 w-full h-full max-w-5xl rounded-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-ink-900/10">
              <p className="font-display">{book.title}</p>
              <button onClick={() => setShowReader(false)} className="btn-ghost">Close ✕</button>
            </div>
            <iframe
              title={book.title}
              src={book.fileUrl}
              className="flex-1 w-full"
              sandbox=""
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
