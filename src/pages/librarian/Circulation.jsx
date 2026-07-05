import { useMemo, useState } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { checkOutByScan, returnBook } from '../../utils/library';
import { ROLES } from '../../utils/roles';
import { formatDate } from '../../utils/dateUtils';
import QRScanner from '../../components/QRScanner';
import AppShell from '../../components/AppShell';

export default function Circulation() {
  const { data: users } = useCollection('users');
  const { data: books } = useCollection('books');
  const { data: records } = useCollection('borrowRecords');
  const [mode, setMode] = useState('out'); // 'out' | 'in'
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [scannerOn, setScannerOn] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'ok'|'error', text }

  const students = useMemo(
    () => users.filter((u) => u.role === ROLES.STUDENT && u.status !== 'archived'
      && (!studentQuery.trim() || u.name.toLowerCase().includes(studentQuery.trim().toLowerCase()))),
    [users, studentQuery]
  );

  async function handleCode(code) {
    setMessage(null);
    // Accept either a raw bookId (from a QR label) or an ISBN typed manually.
    const book = books.find((b) => b.id === code || b.isbn === code);
    if (!book) {
      setMessage({ type: 'error', text: 'No book matches that code.' });
      return;
    }

    if (mode === 'out') {
      if (!selectedStudent) {
        setMessage({ type: 'error', text: 'Select a student first.' });
        return;
      }
      try {
        await checkOutByScan(book.id, selectedStudent.id);
        setMessage({ type: 'ok', text: `Checked out "${book.title}" to ${selectedStudent.name}.` });
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      }
    } else {
      const activeRecord = records.find((r) => r.bookId === book.id && !r.returnedAt);
      if (!activeRecord) {
        setMessage({ type: 'error', text: `"${book.title}" isn't currently checked out.` });
        return;
      }
      await returnBook(activeRecord.id, book.id);
      setMessage({ type: 'ok', text: `Checked in "${book.title}".` });
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCode(manualCode.trim());
    setManualCode('');
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Circulation &amp; Scan</h1>
      <p className="text-ink-500 text-sm mt-1">Check physical books in and out using a QR code or manual entry.</p>

      <div className="flex bg-parchment-100 rounded-sm p-1 border border-ink-900/10 w-fit mt-6">
        <button onClick={() => { setMode('out'); setMessage(null); }} className={`px-4 py-1.5 text-sm rounded-sm ${mode === 'out' ? 'bg-stacks-700 text-white' : 'text-ink-700'}`}>Check out</button>
        <button onClick={() => { setMode('in'); setMessage(null); }} className={`px-4 py-1.5 text-sm rounded-sm ${mode === 'in' ? 'bg-stacks-700 text-white' : 'text-ink-700'}`}>Check in</button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="space-y-4">
          {mode === 'out' && (
            <div className="catalog-card p-4">
              <label className="label">Student</label>
              {selectedStudent ? (
                <div className="flex items-center justify-between">
                  <p className="font-display">{selectedStudent.name}</p>
                  <button className="btn-ghost text-xs" onClick={() => setSelectedStudent(null)}>Change</button>
                </div>
              ) : (
                <>
                  <input className="input" placeholder="Search student by name…" value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} />
                  <div className="max-h-40 overflow-y-auto mt-2 divide-y divide-ink-900/10">
                    {students.slice(0, 8).map((s) => (
                      <button key={s.id} onClick={() => setSelectedStudent(s)} className="w-full text-left px-2 py-1.5 text-sm hover:bg-parchment-100">
                        {s.name} <span className="text-ink-500 text-xs">{s.email}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="catalog-card p-4">
            <label className="label">Scan book code</label>
            {scannerOn ? (
              <QRScanner onScan={handleCode} active={scannerOn} />
            ) : (
              <button className="btn-secondary w-full" onClick={() => setScannerOn(true)}>Enable camera scanner</button>
            )}
          </div>

          <form onSubmit={handleManualSubmit} className="catalog-card p-4 flex gap-2">
            <input className="input" placeholder="Or type book ID / ISBN…" value={manualCode} onChange={(e) => setManualCode(e.target.value)} />
            <button className="btn-primary shrink-0" type="submit">Go</button>
          </form>

          {message && (
            <p className={`text-sm ${message.type === 'ok' ? 'text-stacks-700' : 'text-overdue-600'}`}>{message.text}</p>
          )}
        </div>

        <div>
          <p className="font-display text-lg mb-2">Currently checked out</p>
          <div className="catalog-card divide-y divide-ink-900/10 max-h-[420px] overflow-y-auto">
            {records.filter((r) => !r.returnedAt).sort((a, b) => a.dueAt - b.dueAt).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div>
                  <p>{r.bookTitle}</p>
                  <p className="text-xs text-ink-500">Due {formatDate(r.dueAt)}</p>
                </div>
                <button className="btn-ghost text-xs" onClick={() => returnBook(r.id, r.bookId)}>Check in</button>
              </div>
            ))}
            {records.filter((r) => !r.returnedAt).length === 0 && <p className="px-3 py-3 text-sm text-ink-500">Nothing checked out.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
