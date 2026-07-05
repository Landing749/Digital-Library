import { useCollection } from '../../hooks/useCollection';
import { isOverdue, formatDate } from '../../utils/dateUtils';
import { returnBook } from '../../utils/library';
import AppShell from '../../components/AppShell';

export default function OverdueTracking() {
  const { data: records } = useCollection('borrowRecords');
  const { data: users } = useCollection('users');

  const overdue = records
    .filter((r) => !r.returnedAt && isOverdue(r.dueAt, r.returnedAt))
    .sort((a, b) => a.dueAt - b.dueAt);

  function borrowerFor(uid) {
    return users.find((u) => u.id === uid);
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Overdue Tracking</h1>
      <p className="text-ink-500 text-sm mt-1">{overdue.length} book(s) past their due date.</p>

      <div className="catalog-card divide-y divide-ink-900/10 mt-6">
        {overdue.length === 0 && <p className="px-4 py-4 text-sm text-ink-500">Nothing overdue right now. 🎉</p>}
        {overdue.map((r) => {
          const daysLate = Math.floor((Date.now() - r.dueAt) / (1000 * 60 * 60 * 24));
          const borrower = borrowerFor(r.userId);
          return (
            <div key={r.id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-display truncate">{r.bookTitle}</p>
                <p className="text-xs text-ink-500">{borrower?.name || 'Unknown borrower'} · {borrower?.email}</p>
              </div>
              <span className="stamp-overdue">{daysLate} day(s) late</span>
              <span className="font-mono text-xs text-ink-500">Due {formatDate(r.dueAt)}</span>
              <button className="btn-ghost text-xs" onClick={() => returnBook(r.id, r.bookId)}>Mark returned</button>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
