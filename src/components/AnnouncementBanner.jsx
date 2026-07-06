import { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../firebase';
import { formatDate } from '../utils/dateUtils';

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const q = query(ref(db, 'announcements'), orderByChild('createdAt'), limitToLast(3));
    return onValue(q, (snap) => {
      const list = [];
      snap.forEach((child) => list.push({ id: child.key, ...child.val() }));
      setAnnouncements(list.reverse());
    });
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {announcements.map((a) => (
        <div key={a.id} className="catalog-card px-4 py-3 border-l-4 border-l-brass-500">
          <div className="flex items-center justify-between">
            <p className="font-display text-base">
              {a.title} {a.scope === 'platform' && <span className="stamp-approved ml-1 align-middle">Platform</span>}
            </p>
            <span className="font-mono text-[11px] text-ink-500">{formatDate(a.createdAt)}</span>
          </div>
          <p className="text-sm text-ink-700 mt-1">{a.body}</p>
        </div>
      ))}
    </div>
  );
}
