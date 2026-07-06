import { useMemo, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { useCollection } from '../../hooks/useCollection';
import { formatDateTime } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

const ACTION_LABEL = {
  'school.created': 'Created school',
  'school.removed': 'Removed school',
  'admin.assigned': 'Assigned school admin',
  'user.role_changed': 'Changed account role',
  'user.deactivated': 'Deactivated account',
  'user.reactivated': 'Reactivated account',
  'resource.approved': 'Approved resource',
  'resource.rejected': 'Rejected resource',
  'book.archived': 'Archived book',
  'book.unarchived': 'Unarchived book'
};

function describe(entry) {
  const d = entry.details || {};
  switch (entry.action) {
    case 'school.created': return `"${d.name}"`;
    case 'school.removed': return d.name ? `"${d.name}"` : d.schoolId;
    case 'admin.assigned': return `${d.userName || d.uid} → ${d.schoolName || d.schoolId}`;
    case 'user.role_changed': return `${d.uid} → ${d.role}`;
    case 'user.deactivated':
    case 'user.reactivated': return d.uid;
    case 'resource.approved':
    case 'resource.rejected': return d.resourceId;
    case 'book.archived':
    case 'book.unarchived': return d.bookId;
    default: return '';
  }
}

export default function AuditLog() {
  const { data: entries } = useCollection('auditLog');
  const [filter, setFilter] = useState('all');

  const actions = useMemo(() => ['all', ...new Set(entries.map((e) => e.action))], [entries]);

  const shown = entries
    .filter((e) => filter === 'all' || e.action === filter)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 300);

  return (
    <AppShell>
      <div className="flex items-center gap-2.5">
        <ScrollText size={22} className="text-stacks-700" />
        <h1 className="font-display text-3xl">Audit Log</h1>
      </div>
      <p className="text-ink-500 text-sm mt-1">
        A record of school, account, and content moderation actions taken by admins across the platform.
      </p>

      <select className="input w-56 mt-6" value={filter} onChange={(e) => setFilter(e.target.value)}>
        {actions.map((a) => (
          <option key={a} value={a}>{a === 'all' ? 'All actions' : (ACTION_LABEL[a] || a)}</option>
        ))}
      </select>

      <div className="catalog-card divide-y divide-ink-900/10 mt-4">
        {shown.length === 0 && <p className="px-4 py-6 text-sm text-ink-500">No activity recorded yet.</p>}
        {shown.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-medium">{e.actorName || 'Unknown'}</span>{' '}
                <span className="text-ink-700">{(ACTION_LABEL[e.action] || e.action).toLowerCase()}</span>{' '}
                <span className="text-ink-500 font-mono text-xs">{describe(e)}</span>
              </p>
            </div>
            <span className="font-mono text-[11px] text-ink-500 shrink-0">{formatDateTime(e.createdAt)}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
