import { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone } from 'lucide-react';
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
      <AnimatePresence>
        {announcements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="catalog-card px-4 py-3 border-l-4 border-l-brass-500 flex gap-3"
          >
            <span className="icon-badge w-8 h-8 bg-brass-500/10 text-brass-600 mt-0.5 shrink-0">
              <Megaphone size={15} strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-base truncate">{a.title}</p>
                <span className="font-mono text-[11px] text-ink-500 shrink-0">{formatDate(a.createdAt)}</span>
              </div>
              <p className="text-sm text-ink-700 mt-1">{a.body}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
