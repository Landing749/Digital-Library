import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, FileText, CheckCircle2 } from 'lucide-react';
import { coverThumb } from '../cloudinary';

export default function BookCard({ book, index = 0 }) {
  const isPhysical = book.type === 'physical' || book.type === 'both';
  const isDigital = book.type === 'digital' || book.type === 'both';
  const available = (book.availableCopies ?? 0) > 0;
  const isResource = !!book.status && !!book.uploaderUid;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.035, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link
        to={isResource ? `/resource/${book.id}` : `/book/${book.id}`}
        className="catalog-card group flex flex-col overflow-hidden h-full hover:shadow-lg hover:shadow-ink-900/[0.06]"
      >
        <div className="aspect-[3/4] bg-parchment-200 overflow-hidden relative">
          {book.coverUrl ? (
            <img
              src={coverThumb(book.coverUrl, 300)}
              alt={book.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display text-4xl text-ink-500/40 bg-gradient-to-br from-parchment-100 to-parchment-200">
              {book.title?.[0] || <BookOpen size={28} strokeWidth={1.5} />}
            </div>
          )}
          {isDigital && (
            <span className="absolute top-2 right-2 grid place-items-center w-6 h-6 rounded-full bg-stacks-800/85 text-parchment-50 shadow-sm backdrop-blur-sm">
              <FileText size={12} strokeWidth={2.25} />
            </span>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col gap-1">
          <p className="font-display text-base leading-tight line-clamp-2">{book.title}</p>
          <p className="text-xs text-ink-500">{book.author}</p>
          <div className="mt-auto pt-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wide text-ink-500/70 truncate">
              {book.subject || 'General'}
            </span>
            {isPhysical && (
              <span className={`shrink-0 ${available ? 'stamp-available' : 'stamp-borrowed'}`}>
                {available ? (
                  <><CheckCircle2 size={11} className="mr-0.5" /> In stacks</>
                ) : (
                  'Checked out'
                )}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/** Skeleton placeholder matching BookCard's shape, for loading grids. */
export function BookCardSkeleton() {
  return (
    <div className="catalog-card flex flex-col overflow-hidden h-full">
      <div className="aspect-[3/4] skeleton" />
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-2/5 rounded" />
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="skeleton h-3 w-1/3 rounded" />
          <div className="skeleton h-4 w-14 rounded" />
        </div>
      </div>
    </div>
  );
}
