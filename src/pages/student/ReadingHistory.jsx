import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { formatDateTime } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';

export default function ReadingHistory() {
  const { profile } = useAuth();
  const { data: history } = useCollection(`readingHistory/${profile.uid}`);
  const sorted = [...history].sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0));

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Reading History</h1>
      <p className="text-ink-500 text-sm mt-1">What you've opened, most recent first.</p>

      {sorted.length === 0 ? (
        <p className="text-ink-500 text-sm mt-8">You haven't opened anything yet.</p>
      ) : (
        <div className="divide-y divide-ink-900/10 mt-6 catalog-card">
          {sorted.map((h) => {
            const isResource = h.id.startsWith('res-');
            const to = isResource ? `/resource/${h.id.replace('res-', '')}` : `/book/${h.id}`;
            return (
              <Link to={to} key={h.id} className="flex items-center justify-between px-4 py-3 hover:bg-parchment-100">
                <p className="font-display">{h.title || h.id}</p>
                <span className="font-mono text-xs text-ink-500">{formatDateTime(h.lastReadAt)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
