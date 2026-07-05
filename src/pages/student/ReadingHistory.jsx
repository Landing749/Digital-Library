import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { History, FileText, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { formatDateTime } from '../../utils/dateUtils';
import AppShell from '../../components/AppShell';
import PageTransition from '../../components/PageTransition';
import EmptyState from '../../components/EmptyState';

export default function ReadingHistory() {
  const { profile } = useAuth();
  const { data: history } = useCollection(`readingHistory/${profile.uid}`);
  const sorted = [...history].sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0));

  return (
    <AppShell>
      <PageTransition>
        <h1 className="font-display text-3xl">Reading History</h1>
        <p className="text-ink-500 text-sm mt-1">What you've opened, most recent first.</p>

        {sorted.length === 0 ? (
          <EmptyState icon={History} title="Nothing read yet" hint="Books and resources you open will show up here." />
        ) : (
          <div className="divide-y divide-ink-900/10 mt-6 catalog-card overflow-hidden">
            {sorted.map((h, i) => {
              const isResource = h.id.startsWith('res-');
              const to = isResource ? `/resource/${h.id.replace('res-', '')}` : `/book/${h.id}`;
              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i, 12) * 0.03 }}
                >
                  <Link to={to} className="flex items-center gap-3 px-4 py-3 hover:bg-parchment-100 transition-colors group">
                    <span className="icon-badge w-8 h-8 bg-stacks-700/10 text-stacks-700 shrink-0">
                      <FileText size={14} strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate">{h.title || h.id}</p>
                    </div>
                    <span className="font-mono text-xs text-ink-500 shrink-0">{formatDateTime(h.lastReadAt)}</span>
                    <ChevronRight size={15} className="text-ink-500/50 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </PageTransition>
    </AppShell>
  );
}
