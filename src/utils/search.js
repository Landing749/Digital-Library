/**
 * RTDB doesn't support full-text search, so for a school-scale library
 * (hundreds to a few thousand records) we fetch the relevant list once via
 * a listener and filter/rank client-side. This keeps everything realtime
 * (no separate search index to keep in sync) at a scale this is well suited to.
 * If the catalog grows much larger, swap this for Algolia/Typesense fed by
 * an RTDB->function sync.
 */
export function searchBooks(books, query) {
  if (!query || !query.trim()) return books;
  const q = query.trim().toLowerCase();
  return books
    .map((book) => ({ book, score: scoreBook(book, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.book);
}

function scoreBook(book, q) {
  let score = 0;
  const title = (book.title || '').toLowerCase();
  const author = (book.author || '').toLowerCase();
  const isbn = (book.isbn || '').toLowerCase();
  const subject = (book.subject || '').toLowerCase();
  const keywords = (book.keywords || '').toLowerCase();

  if (title === q) score += 100;
  if (title.startsWith(q)) score += 40;
  if (title.includes(q)) score += 20;
  if (author.includes(q)) score += 15;
  if (isbn.includes(q)) score += 50;
  if (subject.includes(q)) score += 10;
  if (keywords.includes(q)) score += 8;
  return score;
}

export function filterByCategory(items, categoryId) {
  if (!categoryId || categoryId === 'all') return items;
  return items.filter((i) => i.categoryId === categoryId);
}
