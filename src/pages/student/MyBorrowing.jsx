import { motion } from 'framer-motion';
import { BookOpen, History, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { formatDate, isOverdue, daysUntil } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';
import PageTransition from '../../components/PageTransition';
import EmptyState from '../../components/EmptyState';

export default function MyBorrowing() {
  const { profile } = useAuth();
  const { data: records } = useCollection('borrowRecords');
  const mine = records.filter((r) => r.userId === profile.uid).sort((a, b) => b.borrowedAt - a.borrowedAt);
  const active = mine.filter((r) => !r.returnedAt);
  const past = mine.filter((r) => r.returnedAt);

  return (
    <AppShell>
      <PageTransition>
        <h1 className="font-display text-3xl">My Borrowing</h1>
        <p className="text-ink-500 text-sm mt-1">Physical books currently checked out to you, and your history.</p>

        <h2 className="font-display text-xl mt-8 mb-3">Currently borrowed</h2>
        {active.length === 0 ? (
          <EmptyState icon={BookOpen} title="Nothing checked out" hint="Borrow a physical book from the catalog to see it here." />
        ) : (
          <div className="catalog-card divide-y divide-ink-900/10 overflow-hidden">
            {active.map((r, i) => {
              const overdue = isOverdue(r.dueAt, r.returnedAt);
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className={`icon-badge w-9 h-9 shrink-0 ${overdue ? 'bg-overdue-500/10 text-overdue-600' : 'bg-brass-500/10 text-brass-600'}`}>
                    {overdue ? <AlertTriangle size={16} strokeWidth={2.25} /> : <BookOpen size={16} strokeWidth={2.25} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate">{r.bookTitle}</p>
                    <p className="text-xs text-ink-500">Borrowed {formatDate(r.borrowedAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={overdue ? 'stamp-overdue pulse-overdue' : 'stamp-borrowed'}>
                      {overdue ? 'Overdue' : `Due ${formatDate(r.dueAt)}`}
                    </span>
                    {!overdue && <p className="text-[11px] text-ink-500 mt-1">{daysUntil(r.dueAt)} day(s) left</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <h2 className="font-display text-xl mt-10 mb-3">Past borrowing</h2>
        {past.length === 0 ? (
          <EmptyState icon={History} title="No history yet" hint="Books you've returned will be listed here." />
        ) : (
          <div className="catalog-card divide-y divide-ink-900/10 overflow-hidden">
            {past.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: Math.min(i, 12) * 0.03 }}
                className="flex items-center justify-between px-4 py-3"
              >
                <p className="font-display truncate">{r.bookTitle}</p>
                <p className="text-xs font-mono text-ink-500 shrink-0">Returned {formatDate(r.returnedAt)}</p>
              </motion.div>
            ))}
          </div>
        )}
      </PageTransition>
    </AppShell>
  );
}
