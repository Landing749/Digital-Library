import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDoc } from '../hooks/useCollection';
import { toggleBookmark, logReadingHistory } from '../utils/library';
import { formatDate } from '../utils/dateUtils';
import AppShell from '../components/AppShell';

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const resource = useDoc(`resources/${id}`);
  const bookmarkDoc = useDoc(`bookmarks/${profile?.uid}/res-${id}`);
  const [showReader, setShowReader] = useState(false);

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

  async function handleBookmark() {
    await toggleBookmark(profile.uid, `res-${id}`, isBookmarked);
  }
  async function handleRead() {
    setShowReader(true);
    await logReadingHistory(profile.uid, `res-${id}`, { title: resource.title, isResource: true });
  }

  return (
    <AppShell>
      <button onClick={() => navigate(-1)} className="text-xs font-mono uppercase tracking-wide text-ink-500 hover:text-stacks-700">← Back</button>
      <div className="mt-4 max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-500">{resource.subject || 'General'} · {resource.materialType}</p>
        <h1 className="font-display text-3xl mt-1">{resource.title}</h1>
        <p className="text-ink-500 mt-1">Uploaded {formatDate(resource.createdAt)} by {resource.uploaderName || 'a teacher'}</p>
        <p className="text-sm text-ink-700 mt-4">{resource.description}</p>

        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={handleRead} className="btn-primary">Read online</button>
          <a href={resource.fileUrl} download className="btn-secondary">Download</a>
          <button onClick={handleBookmark} className="btn-ghost">{isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}</button>
        </div>
      </div>

      {showReader && (
        <div className="fixed inset-0 z-50 bg-ink-900/80 flex items-center justify-center p-4 md:p-10">
          <div className="bg-parchment-50 w-full h-full max-w-5xl rounded-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-ink-900/10">
              <p className="font-display">{resource.title}</p>
              <button onClick={() => setShowReader(false)} className="btn-ghost">Close ✕</button>
            </div>
            <iframe title={resource.title} src={resource.fileUrl} className="flex-1 w-full" />
          </div>
        </div>
      )}
    </AppShell>
  );
}
