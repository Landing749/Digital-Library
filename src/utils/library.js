import { ref, push, set, update, get, remove, runTransaction, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';
import { addDays, DEFAULT_LOAN_DAYS } from './dateUtils';
import { ROLES } from './roles';

/* ---------------------------------------------------------------------- */
/* Books & categories                                                      */
/* ---------------------------------------------------------------------- */

export async function archiveBook(bookId, archived) {
  await update(ref(db, `books/${bookId}`), { archived });
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
}

/* ---------------------------------------------------------------------- */
/* User & account management                                              */
/* ---------------------------------------------------------------------- */

export async function setUserRole(uid, role) {
  await update(ref(db, `users/${uid}`), { role });
}

export async function setUserStatus(uid, status) {
  await update(ref(db, `users/${uid}`), { status });
}

/* ---------------------------------------------------------------------- */
/* Super admin: schools & school-admin assignment                         */
/* ---------------------------------------------------------------------- */

// Excludes visually-ambiguous characters (0/O, 1/I) so codes are easy to
// read aloud or copy off a printed flyer.
const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateJoinCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)];
  }
  return code;
}

/** Builds a shareable registration link that pre-selects a school on the Register page. */
export function buildJoinLink(joinCode) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/register?school=${joinCode}`;
}

export async function createSchool({ name, address }) {
  const schoolRef = push(ref(db, 'schools'));
  await set(schoolRef, {
    name,
    address: address || '',
    joinCode: generateJoinCode(),
    active: true,
    createdAt: serverTimestamp()
  });
  return schoolRef.key;
}

export async function updateSchool(schoolId, fields) {
  await update(ref(db, `schools/${schoolId}`), fields);
}

/** Invalidates the old invite link and issues a new join code for a school. */
export async function regenerateJoinCode(schoolId) {
  const joinCode = generateJoinCode();
  await update(ref(db, `schools/${schoolId}`), { joinCode });
  return joinCode;
}

/** Soft-disable a school: existing data stays, but its invite link stops working. */
export async function setSchoolActive(schoolId, active) {
  await update(ref(db, `schools/${schoolId}`), { active });
}

export async function deleteSchool(schoolId) {
  await remove(ref(db, `schools/${schoolId}`));
}

/** Promotes an existing account to librarian/admin for a given school. */
export async function assignSchoolAdmin(uid, schoolId) {
  await update(ref(db, `users/${uid}`), { role: ROLES.LIBRARIAN, schoolId });
}

/** Apply the same status (active/archived) to many accounts in one write. */
export async function bulkSetUserStatus(uids, status) {
  const updates = {};
  uids.forEach((uid) => {
    updates[`users/${uid}/status`] = status;
  });
  await update(ref(db), updates);
}
