import { useState } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { setResourceStatus } from '../../utils/library';
import { formatDate } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

export default function ApproveResources() {
  const { data: resources } = useCollection('resources');
  const [filter, setFilter] = useState('pending');

  const shown = resources
    .filter((r) => (filter === 'all' ? true : r.status === filter))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Approve Resources</h1>
      <p className="text-ink-500 text-sm mt-1">Review teacher uploads before they appear to students.</p>

      <div className="flex gap-2 mt-6">
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-sm rounded-sm border ${filter === f ? 'bg-stacks-700 text-white border-stacks-700' : 'border-ink-900/15 text-ink-700'}`}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="catalog-card divide-y divide-ink-900/10 mt-6">
        {shown.length === 0 && <p className="px-4 py-4 text-sm text-ink-500">Nothing here.</p>}
        {shown.map((r) => (
          <div key={r.id} className="flex items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-display truncate">{r.title}</p>
              <p className="text-xs text-ink-500">{r.uploaderName} · {r.subject} · {r.materialType} · {formatDate(r.createdAt)}</p>
            </div>
            <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs">Preview</a>
            {r.status !== 'approved' && (
              <button className="btn-secondary text-xs" onClick={() => setResourceStatus(r.id, 'approved')}>Approve</button>
            )}
            {r.status !== 'rejected' && (
              <button className="btn-ghost text-xs text-overdue-600" onClick={() => setResourceStatus(r.id, 'rejected')}>Reject</button>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
