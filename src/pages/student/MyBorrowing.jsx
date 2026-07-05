import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { formatDate, isOverdue, daysUntil } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

export default function MyBorrowing() {
  const { profile } = useAuth();
  const { data: records } = useCollection('borrowRecords');
  const mine = records.filter((r) => r.userId === profile.uid).sort((a, b) => b.borrowedAt - a.borrowedAt);
  const active = mine.filter((r) => !r.returnedAt);
  const past = mine.filter((r) => r.returnedAt);

  return (
    <AppShell>
      <h1 className="font-display text-3xl">My Borrowing</h1>
      <p className="text-ink-500 text-sm mt-1">Physical books currently checked out to you, and your history.</p>

      <h2 className="font-display text-xl mt-8 mb-3">Currently borrowed</h2>
      {active.length === 0 ? (
        <p className="text-ink-500 text-sm">Nothing checked out right now.</p>
      ) : (
        <div className="catalog-card divide-y divide-ink-900/10">
          {active.map((r) => {
            const overdue = isOverdue(r.dueAt, r.returnedAt);
            return (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-display">{r.bookTitle}</p>
                  <p className="text-xs text-ink-500">Borrowed {formatDate(r.borrowedAt)}</p>
                </div>
                <div className="text-right">
                  <span className={overdue ? 'stamp-overdue' : 'stamp-borrowed'}>
                    {overdue ? `Overdue` : `Due ${formatDate(r.dueAt)}`}
                  </span>
                  {!overdue && <p className="text-[11px] text-ink-500 mt-1">{daysUntil(r.dueAt)} day(s) left</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="font-display text-xl mt-10 mb-3">Past borrowing</h2>
      {past.length === 0 ? (
        <p className="text-ink-500 text-sm">No history yet.</p>
      ) : (
        <div className="catalog-card divide-y divide-ink-900/10">
          {past.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <p className="font-display">{r.bookTitle}</p>
              <p className="text-xs font-mono text-ink-500">Returned {formatDate(r.returnedAt)}</p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
