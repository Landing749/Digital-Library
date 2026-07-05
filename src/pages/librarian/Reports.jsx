import { useMemo } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { isOverdue } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

export default function Reports() {
  const { data: books } = useCollection('books');
  const { data: records } = useCollection('borrowRecords');
  const { data: resources } = useCollection('resources');
  const { data: history } = useCollection('readingHistory'); // note: nested by uid; flattened below if present

  const stats = useMemo(() => {
    const totalLoans = records.length;
    const active = records.filter((r) => !r.returnedAt).length;
    const overdue = records.filter((r) => !r.returnedAt && isOverdue(r.dueAt, r.returnedAt)).length;
    const returned = records.filter((r) => r.returnedAt).length;

    const byBook = {};
    records.forEach((r) => {
      byBook[r.bookTitle] = (byBook[r.bookTitle] || 0) + 1;
    });
    const mostBorrowed = Object.entries(byBook).sort((a, b) => b[1] - a[1]).slice(0, 8);

    return { totalLoans, active, overdue, returned, mostBorrowed };
  }, [records]);

  function exportCsv() {
    const rows = [
      ['Book Title', 'Borrowed At', 'Due At', 'Returned At', 'Status'],
      ...records.map((r) => [
        r.bookTitle,
        new Date(r.borrowedAt).toISOString(),
        new Date(r.dueAt).toISOString(),
        r.returnedAt ? new Date(r.returnedAt).toISOString() : '',
        r.returnedAt ? 'returned' : isOverdue(r.dueAt) ? 'overdue' : 'borrowed'
      ])
    ];
    const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `borrowing-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Reports</h1>
          <p className="text-ink-500 text-sm mt-1">Library usage and borrowing activity.</p>
        </div>
        <button className="btn-secondary" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mt-6">
        <Stat label="Total titles" value={books.filter((b) => !b.archived).length} />
        <Stat label="Total loans (all time)" value={stats.totalLoans} />
        <Stat label="Currently out" value={stats.active} />
        <Stat label="Overdue" value={stats.overdue} alert={stats.overdue > 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div>
          <p className="font-display text-lg mb-2">Most borrowed titles</p>
          <div className="catalog-card divide-y divide-ink-900/10">
            {stats.mostBorrowed.length === 0 && <p className="px-4 py-3 text-sm text-ink-500">No borrowing activity yet.</p>}
            {stats.mostBorrowed.map(([title, count]) => (
              <div key={title} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{title}</span>
                <span className="font-mono text-ink-500">{count}×</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="font-display text-lg mb-2">Resource uploads</p>
          <div className="catalog-card p-4 space-y-1 text-sm">
            <p>Total uploaded: <b>{resources.length}</b></p>
            <p>Approved: <b>{resources.filter((r) => r.status === 'approved').length}</b></p>
            <p>Pending: <b>{resources.filter((r) => r.status === 'pending').length}</b></p>
            <p>Rejected: <b>{resources.filter((r) => r.status === 'rejected').length}</b></p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, alert }) {
  return (
    <div className="catalog-card p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`font-display text-4xl mt-1 ${alert ? 'text-overdue-600' : ''}`}>{value}</p>
    </div>
  );
}
