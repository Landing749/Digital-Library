import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDoc, useCollection } from '../hooks/useCollection';
import { toggleBookmark, logReadingHistory, submitReview, removeReview, incrementResourceStat } from '../utils/library';
import { formatDate } from '../utils/dateUtils';
import AppShell from '../components/AppShell';

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const resource = useDoc(`resources/${id}`);
  const bookmarkDoc = useDoc(`bookmarks/${profile?.uid}/res-${id}`);
  const { data: reviews } = useCollection(`reviews/res-${id}`);
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

  if (resource === undefined) {
    return <AppShell><p className="text-ink-500 font-mono text-sm">Loading resource…</p></AppShell>;
  }
  if (resource === null || resource.status !== 'approved') {
    return (
      <AppShell>
        <p className="text-overdue-600">This resource isn't available (it may be pending approval or removed).</p>
      </AppShell>
    );
  }

  const isBookmarked = !!bookmarkDoc;
  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0;
  const myReview = reviews.find((r) => r.id === profile?.uid);

  async function handleBookmark() {
    await toggleBookmark(profile.uid, `res-${id}`, isBookmarked);
  }
  async function handleRead() {
    setShowReader(true);
    await logReadingHistory(profile.uid, `res-${id}`, { title: resource.title, isResource: true });
    await incrementResourceStat(id, 'views');
  }
  async function handleDownload() {
    await incrementResourceStat(id, 'downloads');
  }
  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!myRating) return;
    await submitReview(`res-${id}`, profile.uid, { rating: myRating, userName: profile.name, comment: myComment });
  }

  return (
    <AppShell>
      <button onClick={() => navigate(-1)} className="text-xs font-mono uppercase tracking-wide text-ink-500 hover:text-stacks-700">← Back</button>
      <div className="mt-4 max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-500">{resource.subject || 'General'} · {resource.materialType}</p>
        <h1 className="font-display text-3xl mt-1">{resource.title}</h1>
        <p className="text-ink-500 mt-1">Uploaded {formatDate(resource.createdAt)} by {resource.uploaderName || 'a teacher'}</p>
        {reviews.length > 0 && (
          <span className="inline-flex items-center gap-1 text-sm text-ink-700 mt-2">
            <Star size={15} className="text-brass-600 fill-brass-500" strokeWidth={1.5} />
            {avgRating.toFixed(1)} <span className="text-ink-500">({reviews.length} rating{reviews.length === 1 ? '' : 's'})</span>
          </span>
        )}
        <p className="text-sm text-ink-700 mt-4">{resource.description}</p>

        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={handleRead} className="btn-primary">Read online</button>
          <a href={resource.fileUrl} download onClick={handleDownload} className="btn-secondary">Download</a>
          <button onClick={handleBookmark} className="btn-ghost">{isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}</button>
        </div>
      </div>

      <div className="mt-10 max-w-2xl">
        <h2 className="font-display text-xl">Ratings &amp; reviews</h2>

        <form onSubmit={handleReviewSubmit} className="catalog-card p-4 mt-3 space-y-3">
          <div>
            <label className="label">{myReview ? 'Update your rating' : 'Rate this resource'}</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setMyRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
                  <Star size={22} strokeWidth={1.5} className={n <= myRating ? 'text-brass-600 fill-brass-500' : 'text-ink-500/30'} />
                </button>
              ))}
            </div>
          </div>
          <textarea className="input" rows={2} maxLength={1000} placeholder="Optional comment…" value={myComment} onChange={(e) => setMyComment(e.target.value)} />
          <div className="flex gap-3">
            <button className="btn-primary" type="submit" disabled={!myRating}>{myReview ? 'Update review' : 'Submit review'}</button>
            {myReview && (
              <button
                type="button"
                className="btn-ghost text-overdue-600"
                onClick={() => { removeReview(`res-${id}`, profile.uid); setMyRating(0); setMyComment(''); }}
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

      {showReader && (
        <div className="fixed inset-0 z-50 bg-ink-900/80 flex items-center justify-center p-4 md:p-10">
          <div className="bg-parchment-50 w-full h-full max-w-5xl rounded-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-ink-900/10">
              <p className="font-display">{resource.title}</p>
              <button onClick={() => setShowReader(false)} className="btn-ghost">Close ✕</button>
            </div>
            <iframe
              title={resource.title}
              src={resource.fileUrl}
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
