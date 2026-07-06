import { ref, push, set, update, get, remove, runTransaction, serverTimestamp } from 'firebase/database';
import { db, auth } from '../firebase';
import { addDays, DEFAULT_LOAN_DAYS } from './dateUtils';
import { ROLES } from './roles';

/* ---------------------------------------------------------------------- */
/* Audit trail (super admin & librarian actions)                          */
/* ---------------------------------------------------------------------- */

// Fire-and-forget: audit logging should never block or fail the action it's
// recording, so errors are swallowed (and logged to the console) rather than
// thrown back to the caller.
async function logAudit(action, details = {}) {
  try {
    const user = auth.currentUser;
    const entryRef = push(ref(db, 'auditLog'));
    await set(entryRef, {
      action,
      actorUid: user?.uid || null,
      actorName: user?.displayName || user?.email || 'Unknown',
      details,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('logAudit failed:', err);
  }
}

/* ---------------------------------------------------------------------- */
/* Books & categories                                                      */
/* ---------------------------------------------------------------------- */

export async function archiveBook(bookId, archived) {
  await update(ref(db, `books/${bookId}`), { archived });
  await logAudit(archived ? 'book.archived' : 'book.unarchived', { bookId });
}

/* ---------------------------------------------------------------------- */
/* Bookmarks & reading history                                            */
/* ---------------------------------------------------------------------- */

export async function toggleBookmark(uid, itemId, isBookmarked) {
  const bookmarkRef = ref(db, `bookmarks/${uid}/${itemId}`);
  if (isBookmarked) {
    await remove(bookmarkRef);
  } else {
    await set(bookmarkRef, { createdAt: serverTimestamp() });
  }
}

export async function logReadingHistory(uid, itemId, extra = {}) {
  await update(ref(db, `readingHistory/${uid}/${itemId}`), {
    ...extra,
    lastReadAt: serverTimestamp()
  });
}

/* ---------------------------------------------------------------------- */
/* Ratings & reviews (shared by books and resources — resource ids are    */
/* namespaced "res-<id>", the same convention bookmarks already use)      */
/* ---------------------------------------------------------------------- */

export async function submitReview(itemId, uid, { rating, userName, comment }) {
  await set(ref(db, `reviews/${itemId}/${uid}`), {
    rating,
    userName,
    comment: comment || '',
    createdAt: serverTimestamp()
  });
}

export async function removeReview(itemId, uid) {
  await remove(ref(db, `reviews/${itemId}/${uid}`));
}

/* ---------------------------------------------------------------------- */
/* Holds (waitlist for a physical book that's fully checked out)          */
/* ---------------------------------------------------------------------- */

export async function placeHold(book, uid, userName) {
  if (!book?.id) throw new Error('Invalid book.');
  const holdRef = push(ref(db, 'holds'));
  await set(holdRef, {
    uid,
    userName,
    bookId: book.id,
    bookTitle: book.title,
    status: 'waiting',
    createdAt: serverTimestamp()
  });
}

export async function cancelHold(holdId) {
  await remove(ref(db, `holds/${holdId}`));
}

/* ---------------------------------------------------------------------- */
/* Circulation (borrowing physical copies)                                */
/* ---------------------------------------------------------------------- */

// Runs as an RTDB transaction so two people checking out the last copy at
// the same moment can't both succeed — the second one fails cleanly.
async function decrementAvailability(bookId) {
  const result = await runTransaction(ref(db, `books/${bookId}/availableCopies`), (current) => {
    if (current === null || current === undefined) return current;
    if (current <= 0) return; // abort the transaction — nothing left to lend
    return current - 1;
  });
  if (!result.committed) {
    throw new Error('No copies available to borrow right now.');
  }
}

async function incrementAvailability(bookId) {
  await runTransaction(ref(db, `books/${bookId}/availableCopies`), (current) => (current || 0) + 1);
}

/** Student self-service borrow from the book detail page. */
export async function borrowBook(book, userId) {
  if (!book?.id) throw new Error('Invalid book.');
  await decrementAvailability(book.id);
  const borrowedAt = Date.now();
  try {
    const recordRef = push(ref(db, 'borrowRecords'));
    await set(recordRef, {
      bookId: book.id,
      bookTitle: book.title,
      userId,
      borrowedAt,
      dueAt: addDays(borrowedAt, DEFAULT_LOAN_DAYS),
      returnedAt: null
    });
  } catch (err) {
    await incrementAvailability(book.id); // roll back the copy count
    throw err;
  }
}

/** Librarian check-out via barcode/QR scan or manual code entry. */
export async function checkOutByScan(bookId, userId) {
  const snap = await get(ref(db, `books/${bookId}`));
  if (!snap.exists()) throw new Error('No book matches that code.');
  const book = { id: bookId, ...snap.val() };
  if (book.archived) throw new Error('This book has been archived.');
  await borrowBook(book, userId);
}

/** Librarian check-in, or a student/self return flow if ever exposed. */
export async function returnBook(recordId, bookId) {
  await update(ref(db, `borrowRecords/${recordId}`), { returnedAt: Date.now() });
  await incrementAvailability(bookId);
}

/* ---------------------------------------------------------------------- */
/* Teacher resources (librarian approval workflow)                        */
/* ---------------------------------------------------------------------- */

export async function setResourceStatus(resourceId, status) {
  await update(ref(db, `resources/${resourceId}`), { status });
  await logAudit(`resource.${status}`, { resourceId });
}

/** Fire-and-forget engagement counters shown to teachers on their uploads. */
export async function incrementResourceStat(resourceId, stat) {
  if (stat !== 'views' && stat !== 'downloads') return;
  await runTransaction(ref(db, `resources/${resourceId}/${stat}`), (current) => (current || 0) + 1);
}

/* ---------------------------------------------------------------------- */
/* User & account management                                              */
/* ---------------------------------------------------------------------- */

export async function setUserRole(uid, role) {
  await update(ref(db, `users/${uid}`), { role });
  await logAudit('user.role_changed', { uid, role });
}

export async function setUserStatus(uid, status) {
  await update(ref(db, `users/${uid}`), { status });
  await logAudit(status === 'archived' ? 'user.deactivated' : 'user.reactivated', { uid });
}

/* ---------------------------------------------------------------------- */
/* Super admin: schools & school-admin assignment                         */
/* ---------------------------------------------------------------------- */

export async function createSchool({ name, address }) {
  const schoolRef = push(ref(db, 'schools'));
  await set(schoolRef, {
    name,
    address: address || '',
    createdAt: serverTimestamp()
  });
  await logAudit('school.created', { schoolId: schoolRef.key, name });
  return schoolRef.key;
}

export async function deleteSchool(schoolId, name) {
  await remove(ref(db, `schools/${schoolId}`));
  await logAudit('school.removed', { schoolId, name: name || null });
}

/** Promotes an existing account to librarian/admin for a given school. */
export async function assignSchoolAdmin(uid, schoolId, userName, schoolName) {
  await update(ref(db, `users/${uid}`), { role: ROLES.LIBRARIAN, schoolId });
  await logAudit('admin.assigned', { uid, userName: userName || null, schoolId, schoolName: schoolName || null });
}

/* ---------------------------------------------------------------------- */
/* Super admin: platform-wide category templates                         */
/* ---------------------------------------------------------------------- */

export async function createGlobalCategory(name) {
  const catRef = push(ref(db, 'globalCategories'));
  await set(catRef, { name, createdAt: serverTimestamp() });
}

export async function deleteGlobalCategory(id) {
  await remove(ref(db, `globalCategories/${id}`));
}

/** Librarian one-click import of a platform template into their own catalog. */
export async function importGlobalCategory(name) {
  const catRef = push(ref(db, 'categories'));
  await set(catRef, { name, createdAt: serverTimestamp() });
}
