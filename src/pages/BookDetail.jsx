import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BookOpen, Download, BookmarkCheck, BookmarkPlus,
  Hash, Tag, CalendarDays, Barcode, X, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDoc, useCollection } from '../hooks/useCollection';
import { toggleBookmark, logReadingHistory, borrowBook } from '../utils/library';
import { formatDate } from '../utils/dateUtils';
import AppShell from '../components/AppShell';
import PageTransition from '../components/PageTransition';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const book = useDoc(`books/${id}`);
  const bookmarkDoc = useDoc(`bookmarks/${profile?.uid}/${id}`);
  const { data: categories } = useCollection('categories');
  const [borrowMsg, setBorrowMsg] = useState('');
  const [showReader, setShowReader] = useState(false);

  if (book === undefined) {
    return (
      <AppShell>
        <div className="grid md:grid-cols-[220px_1fr] gap-8">
          <div className="skeleton aspect-[3/4] rounded-xl" />
          <div className="space-y-3">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-8 w-2/3 rounded" />
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-20 w-full rounded mt-4" />
          </div>
        </div>
      </AppShell>
    );
  }
  if (book === null) {
    return (
      <AppShell>
        <div className="empty-state">
          <div className="empty-state-icon bg-overdue-500/10 text-overdue-600">
            <AlertCircle size={24} strokeWidth={1.75} />
          </div>
          <p className="font-display text-lg">This item couldn't be found</p>
          <p className="text-sm text-ink-500">It may have been archived.</p>
        </div>
      </AppShell>
    );
  }

  const category = categories.find((c) => c.id === book.categoryId);
  const isBookmarked = !!bookmarkDoc;
  const isPhysical = book.type === 'physical' || book.type === 'both';
  const isDigital = book.type === 'digital' || book.type === 'both';
  const available = (book.availableCopies ?? 0) > 0;

  async function handleBookmark() {
    await toggleBookmark(profile.uid, id, isBookmarked);
  }

  async function handleRead() {
    setShowReader(true);
    await logReadingHistory(profile.uid, id, { title: book.title, coverUrl: book.coverUrl || null });
  }

  async function handleBorrow() {
    setBorrowMsg('');
    try {
      await borrowBook(book, profile.uid);
      setBorrowMsg('Borrowed! Check "My Borrowing" for your due date.');
    } catch (err) {
      setBorrowMsg(err.message || 'Could not borrow this book.');
    }
  }

  return (
    <AppShell>
      <PageTransition>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-mono uppercase tracking-wide text-ink-500 hover:text-stacks-700 transition-colors group">
          <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" /> Back
        </button>

        <div className="mt-4 grid md:grid-cols-[220px_1fr] gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="catalog-card aspect-[3/4] overflow-hidden"
          >
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display text-6xl text-ink-500/30 bg-gradient-to-br from-parchment-100 to-parchment-200">
                {book.title?.[0]}
              </div>
            )}
          </motion.div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-500 flex items-center gap-1.5">
              <Tag size={11} /> {category?.name || book.subject || 'General'}
            </p>
            <h1 className="font-display text-3xl mt-1">{book.title}</h1>
            <p className="text-ink-500 mt-1">by {book.author}</p>

            <div className="flex flex-wrap gap-2 mt-4">
              {isPhysical && (
                <span className={available ? 'stamp-available' : 'stamp-borrowed'}>
                  {available ? `${book.availableCopies} of ${book.totalCopies} in stacks` : 'All copies checked out'}
                </span>
              )}
              {isDigital && (
                <span className="stamp-approved flex items-center gap-1">
                  <CheckCircle2 size={11} /> Digital copy available
                </span>
              )}
            </div>

            <p className="text-sm text-ink-700 mt-5 leading-relaxed max-w-2xl">{book.description || 'No description provided yet.'}</p>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6 max-w-md font-mono text-xs">
              <MetaRow icon={Barcode} label="ISBN" value={book.isbn || '—'} />
              <MetaRow icon={Tag} label="Subject" value={book.subject || '—'} />
              <MetaRow icon={CalendarDays} label="Added" value={formatDate(book.createdAt)} />
              <MetaRow icon={Hash} label="Call No." value={book.id.slice(0, 8).toUpperCase()} />
            </dl>

            <div className="flex flex-wrap gap-3 mt-7">
              {isDigital && book.fileUrl && (
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleRead} className="btn-primary">
                  <BookOpen size={15} /> Read online
                </motion.button>
              )}
              {isDigital && book.fileUrl && (
                <a href={book.fileUrl} download className="btn-secondary">
                  <Download size={15} /> Download
                </a>
              )}
              {isPhysical && available && (
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleBorrow} className="btn-secondary">
                  Borrow this copy
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleBookmark} className="btn-ghost">
                <motion.span
                  key={isBookmarked ? 'on' : 'off'}
                  initial={{ scale: 0.6, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="flex items-center gap-1.5"
                >
                  {isBookmarked ? (
                    <><BookmarkCheck size={15} className="text-brass-600" /> Bookmarked</>
                  ) : (
                    <><BookmarkPlus size={15} /> Bookmark</>
                  )}
                </motion.span>
              </motion.button>
            </div>
            <AnimatePresence>
              {borrowMsg && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-stacks-700 mt-3"
                >
                  {borrowMsg}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </PageTransition>

      <AnimatePresence>
        {showReader && book.fileUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-900/80 flex items-center justify-center p-4 md:p-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-parchment-50 w-full h-full max-w-5xl rounded-sm overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-ink-900/10">
                <p className="font-display">{book.title}</p>
                <button onClick={() => setShowReader(false)} className="btn-ghost">
                  <X size={15} /> Close
                </button>
              </div>
              <iframe title={book.title} src={book.fileUrl} className="flex-1 w-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-1.5">
      <Icon size={12} className="text-ink-500/60 mt-0.5 shrink-0" />
      <div>
        <dt className="text-ink-500">{label}</dt>
        <dd className="text-ink-900">{value}</dd>
      </div>
    </div>
  );
}
