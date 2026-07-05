import { Link } from 'react-router-dom';
import { coverThumb } from '../cloudinary';

export default function BookCard({ book }) {
  const isPhysical = book.type === 'physical' || book.type === 'both';
  const available = (book.availableCopies ?? 0) > 0;

  const isResource = !!book.status && !!book.uploaderUid;

  return (
    <Link
      to={isResource ? `/resource/${book.id}` : `/book/${book.id}`}
      className="catalog-card group flex flex-col overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-[3/4] bg-parchment-200 overflow-hidden">
        {book.coverUrl ? (
          <img
            src={coverThumb(book.coverUrl, 300)}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display text-4xl text-ink-500/40">
            {book.title?.[0] || '?'}
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="font-display text-base leading-tight line-clamp-2">{book.title}</p>
        <p className="text-xs text-ink-500">{book.author}</p>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wide text-ink-500/70">
            {book.subject || 'General'}
          </span>
          {isPhysical && (
            <span className={available ? 'stamp-available' : 'stamp-borrowed'}>
              {available ? 'In stacks' : 'Checked out'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
