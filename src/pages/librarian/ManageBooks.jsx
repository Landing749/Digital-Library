import { useState } from 'react';
import { ref, push, set, update, serverTimestamp } from 'firebase/database';
import { db } from '../../firebase';
import { uploadToCloudinary, coverThumb } from '../../cloudinary';
import { useCollection } from '../../hooks/useCollection';
import { archiveBook } from '../../utils/library';
import BookQRLabel from '../../components/BookQRLabel';
import AppShell from '../../components/AppShell';

const EMPTY = {
  title: '', author: '', isbn: '', subject: '', categoryId: '', type: 'physical',
  totalCopies: 1, description: ''
};

export default function ManageBooks() {
  const { data: books } = useCollection('books');
  const { data: categories } = useCollection('categories');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [labelBook, setLabelBook] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function set_(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(book) {
    setEditingId(book.id);
    setForm({
      title: book.title, author: book.author, isbn: book.isbn || '', subject: book.subject || '',
      categoryId: book.categoryId || '', type: book.type, totalCopies: book.totalCopies || 1,
      description: book.description || ''
    });
    setShowForm(true);
  }

  function startNew() {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      let coverUrl, fileUrl;
      if (coverFile) coverUrl = (await uploadToCloudinary(coverFile, null, 'covers')).url;
      if (pdfFile) fileUrl = (await uploadToCloudinary(pdfFile, null, 'books')).url;

      const payload = {
        ...form,
        totalCopies: Number(form.totalCopies),
        archived: false
      };
      if (coverUrl) payload.coverUrl = coverUrl;
      if (fileUrl) payload.fileUrl = fileUrl;

      if (editingId) {
        // Keep availableCopies in sync if totalCopies increased/decreased manually.
        await update(ref(db, `books/${editingId}`), payload);
      } else {
        const bookRef = push(ref(db, 'books'));
        await set(bookRef, { ...payload, availableCopies: payload.totalCopies, createdAt: serverTimestamp() });
      }
      setMessage('Saved.');
      setForm(EMPTY);
      setCoverFile(null);
      setPdfFile(null);
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setMessage(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Manage Books</h1>
          <p className="text-ink-500 text-sm mt-1">Add, edit, or archive catalog titles.</p>
        </div>
        <button className="btn-primary" onClick={startNew}>+ Add book</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="catalog-card p-6 mt-6 max-w-2xl space-y-4">
          <p className="font-display text-lg">{editingId ? 'Edit book' : 'New book'}</p>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => set_('title', e.target.value)} /></div>
            <div><label className="label">Author</label><input className="input" required value={form.author} onChange={(e) => set_('author', e.target.value)} /></div>
            <div><label className="label">ISBN</label><input className="input" value={form.isbn} onChange={(e) => set_('isbn', e.target.value)} /></div>
            <div><label className="label">Subject</label><input className="input" value={form.subject} onChange={(e) => set_('subject', e.target.value)} /></div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.categoryId} onChange={(e) => set_('categoryId', e.target.value)}>
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => set_('type', e.target.value)}>
                <option value="physical">Physical only</option>
                <option value="digital">Digital only</option>
                <option value="both">Physical + Digital</option>
              </select>
            </div>
            {(form.type === 'physical' || form.type === 'both') && (
              <div><label className="label">Total copies</label><input className="input" type="number" min={0} value={form.totalCopies} onChange={(e) => set_('totalCopies', e.target.value)} /></div>
            )}
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={(e) => set_('description', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Cover image</label><input className="input" type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} /></div>
            {(form.type === 'digital' || form.type === 'both') && (
              <div><label className="label">Digital file (PDF)</label><input className="input" type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])} /></div>
            )}
          </div>
          {message && <p className="text-sm text-stacks-700">{message}</p>}
          <div className="flex gap-3">
            <button className="btn-primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save book'}</button>
            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-8 catalog-card divide-y divide-ink-900/10">
        {books.map((b) => (
          <div key={b.id} className="flex items-center gap-4 px-4 py-3">
            <div className="w-10 h-14 bg-parchment-200 rounded-sm overflow-hidden shrink-0">
              {b.coverUrl && <img src={coverThumb(b.coverUrl, 60)} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display truncate">{b.title} {b.archived && <span className="text-overdue-600 text-xs font-mono">(archived)</span>}</p>
              <p className="text-xs text-ink-500">{b.author} · {b.type} {b.type !== 'digital' && `· ${b.availableCopies}/${b.totalCopies} available`}</p>
            </div>
            <button className="btn-ghost text-xs" onClick={() => setLabelBook(b)}>QR label</button>
            <button className="btn-ghost text-xs" onClick={() => startEdit(b)}>Edit</button>
            <button className="btn-ghost text-xs text-overdue-600" onClick={() => archiveBook(b.id, !b.archived)}>
              {b.archived ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        ))}
      </div>

      {labelBook && (
        <div className="fixed inset-0 z-50 bg-ink-900/70 flex items-center justify-center p-6" onClick={() => setLabelBook(null)}>
          <div onClick={(e) => e.stopPropagation()} className="space-y-4">
            <BookQRLabel book={labelBook} />
            <div className="flex gap-2 justify-center">
              <button className="btn-secondary" onClick={() => window.print()}>Print</button>
              <button className="btn-ghost" onClick={() => setLabelBook(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
