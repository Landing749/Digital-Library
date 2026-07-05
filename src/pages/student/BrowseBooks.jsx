import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookMarked, GraduationCap, SearchX, Tags } from 'lucide-react';
import { useCollection } from '../../hooks/useCollection';
import { searchBooks, filterByCategory } from '../../utils/search';
import BookCard, { BookCardSkeleton } from '../../components/BookCard';
import AppShell from '../../components/AppShell';
import PageTransition from '../../components/PageTransition';
import EmptyState from '../../components/EmptyState';

export default function BrowseBooks() {
  const { data: books, loading: loadingBooks } = useCollection('books');
  const { data: resources } = useCollection('resources');
  const { data: categories } = useCollection('categories');
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [tab, setTab] = useState('books');

  const activeBooks = useMemo(() => books.filter((b) => !b.archived), [books]);
  const approvedResources = useMemo(
    () => resources.filter((r) => r.status === 'approved').map((r) => ({ ...r, type: 'digital', availableCopies: 1 })),
    [resources]
  );

  const source = tab === 'books' ? activeBooks : approvedResources;
  const filtered = searchBooks(filterByCategory(source, categoryId), q);

  return (
    <AppShell>
      <PageTransition>
        <h1 className="font-display text-3xl">Browse &amp; Search</h1>
        <p className="text-ink-500 text-sm mt-1">Search by title, author, subject, ISBN, or keyword.</p>

        <div className="flex flex-wrap gap-3 mt-6">
          <div className="tab-pill-track">
            {[
              { key: 'books', label: 'Library Books', icon: BookMarked },
              { key: 'resources', label: 'Teacher Resources', icon: GraduationCap }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`tab-pill-btn flex items-center gap-1.5 ${tab === key ? 'text-white' : 'text-ink-700'}`}
              >
                {tab === key && (
                  <motion.span
                    layoutId="browse-tab-pill"
                    className="absolute inset-0 bg-stacks-700 rounded-md -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <Icon size={14} strokeWidth={2} /> {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500/60" />
            <input
              className="input pl-9"
              placeholder="Search title, author, ISBN, subject…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="relative w-48">
            <Tags size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500/60 pointer-events-none" />
            <select className="input pl-8 appearance-none" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {loadingBooks ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
            {Array.from({ length: 10 }).map((_, i) => <BookCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nothing matches that search"
            hint="Try a different keyword, or clear the category filter."
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
              {filtered.map((b, i) => <BookCard key={b.id} book={b} index={i} />)}
            </div>
          </AnimatePresence>
        )}
      </PageTransition>
    </AppShell>
  );
}
