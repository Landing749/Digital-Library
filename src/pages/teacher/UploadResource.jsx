import { useState } from 'react';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { db } from '../../firebase';
import { uploadToCloudinary } from '../../cloudinary';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import AppShell from '../../components/AppShell';

const MATERIAL_TYPES = ['PDF', 'Notes', 'Presentation', 'Reviewer', 'E-book'];

// Client-side checks only — a determined attacker can bypass anything run in
// the browser. The real enforcement boundary is the Cloudinary upload
// preset (restrict allowed formats there too; see SECURITY.md). This just
// gives honest users a fast, friendly error instead of a silent bad upload.
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.odt', '.odp', '.epub', '.txt'];
const MAX_FILE_MB = 25;

function isAllowedFile(file) {
  const name = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export default function UploadResource() {
  const { profile } = useAuth();
  const { data: categories } = useCollection('categories');
  const [form, setForm] = useState({ title: '', subject: '', categoryId: '', materialType: 'PDF', description: '' });
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  function set_(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setMessage('Choose a file to upload.');
      return;
    }
    if (!isAllowedFile(file)) {
      setMessage(`That file type isn't supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setMessage(`That file is too large — please keep uploads under ${MAX_FILE_MB}MB.`);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const uploaded = await uploadToCloudinary(file, setProgress, 'resources');
      const recordRef = push(ref(db, 'resources'));
      await set(recordRef, {
        ...form,
        fileUrl: uploaded.url,
        fileFormat: uploaded.format,
        uploaderUid: profile.uid,
        uploaderName: profile.name,
        status: 'pending', // librarian/admin must approve before it's visible to students
        createdAt: serverTimestamp()
      });
      setMessage('Uploaded! It will appear in the library once a librarian approves it.');
      setForm({ title: '', subject: '', categoryId: '', materialType: 'PDF', description: '' });
      setFile(null);
      setProgress(0);
    } catch (err) {
      setMessage(err.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Upload a Resource</h1>
      <p className="text-ink-500 text-sm mt-1">Share notes, presentations, reviewers, or e-books with your students.</p>

      <form onSubmit={handleSubmit} className="catalog-card p-6 mt-6 max-w-xl space-y-4">
        <div>
          <label className="label">Title</label>
          <input className="input" required value={form.title} onChange={(e) => set_('title', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Subject</label>
            <input className="input" required value={form.subject} onChange={(e) => set_('subject', e.target.value)} />
          </div>
          <div>
            <label className="label">Material type</label>
            <select className="input" value={form.materialType} onChange={(e) => set_('materialType', e.target.value)}>
              {MATERIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.categoryId} onChange={(e) => set_('categoryId', e.target.value)}>
            <option value="">Uncategorized</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => set_('description', e.target.value)} />
        </div>
        <div>
          <label className="label">File (PDF, PPTX, DOCX…)</label>
          <input
            className="input"
            type="file"
            required
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={(e) => setFile(e.target.files[0])}
          />
          <p className="text-[11px] text-ink-500 mt-1">Max {MAX_FILE_MB}MB.</p>
        </div>
        {busy && (
          <div className="w-full h-2 bg-parchment-200 rounded-full overflow-hidden">
            <div className="h-full bg-stacks-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {message && <p className="text-sm text-stacks-700">{message}</p>}
        <button className="btn-primary" disabled={busy} type="submit">{busy ? 'Uploading…' : 'Submit for approval'}</button>
      </form>
    </AppShell>
  );
}
