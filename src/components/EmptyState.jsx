import { motion } from 'framer-motion';

/**
 * Shared empty/zero-data illustration: a soft icon medallion, headline,
 * and optional hint or call-to-action. Used anywhere a list can be empty
 * (bookmarks, history, borrowing, search results) so the app never shows
 * a bare sentence with nothing to look at.
 */
export default function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="empty-state"
    >
      <div className="empty-state-icon">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <div>
        <p className="font-display text-lg text-ink-900">{title}</p>
        {hint && <p className="text-sm text-ink-500 mt-1 max-w-xs">{hint}</p>}
      </div>
      {action}
    </motion.div>
  );
}
