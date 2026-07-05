import { useState } from 'react';
import { Copy, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { regenerateJoinCode, buildJoinLink } from '../../utils/library';
import AppShell from '../../components/AppShell';

export default function Invite() {
  const { profile } = useAuth();
  const { data: schools, loading } = useCollection('schools');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const school = schools.find((s) => s.id === profile?.schoolId);

  async function handleCopy() {
    const link = buildJoinLink(school.joinCode);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this invite link:', link);
    }
  }

  async function handleRegenerate() {
    if (!confirm('Generate a new invite link? The old one will stop working for anyone who hasn\'t registered yet.')) return;
    setBusy(true);
    try {
      await regenerateJoinCode(school.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl">Invite People</h1>
      <p className="text-ink-500 text-sm mt-1">
        Share this link with your students and teachers. Anyone who registers through it is automatically
        placed under {school ? school.name : 'your school'} — no manual sorting needed.
      </p>

      {loading && <p className="text-sm text-ink-500 mt-6">Loading…</p>}

      {!loading && !school && (
        <div className="catalog-card p-6 mt-6 flex items-start gap-3">
          <AlertTriangle size={18} className="text-overdue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-ink-700">
            Your account isn't linked to a school yet. Ask your super admin to assign you to one from
            Assign School Admins — your invite link will appear here once that's done.
          </p>
        </div>
      )}

      {!loading && school && (
        <div className="catalog-card p-6 mt-6 max-w-2xl space-y-4">
          <div>
            <p className="label">Your school</p>
            <p className="font-display text-xl">{school.name}</p>
          </div>
          <div className="flex items-center gap-2 bg-parchment-100/60 rounded-lg px-3 py-2.5 flex-wrap">
            <p className="font-mono text-xs text-ink-700 truncate flex-1 min-w-[220px]">{buildJoinLink(school.joinCode)}</p>
            <button className="btn-secondary text-xs shrink-0" onClick={handleCopy}>
              {copied ? <><Check size={13} className="inline mr-1" />Copied</> : <><Copy size={13} className="inline mr-1" />Copy link</>}
            </button>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-ink-500">
              Invite code: <span className="font-mono">{school.joinCode}</span>
            </p>
            <button className="btn-ghost text-xs" disabled={busy} onClick={handleRegenerate}>
              <RefreshCw size={13} className="inline mr-1" />{busy ? 'Working…' : 'Generate new link'}
            </button>
          </div>
          <p className="text-[11px] text-ink-500">
            Generating a new link immediately deactivates the old one — anyone with the previous link
            won't be able to use it to register anymore.
          </p>
        </div>
      )}
    </AppShell>
  );
}
