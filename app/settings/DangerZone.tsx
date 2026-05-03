'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DangerZone({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    if (typed.trim().toLowerCase() !== 'delete my account') {
      setError('Please type "delete my account" exactly to confirm.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: rpcErr } = await supabase.rpc('delete_user');
    if (rpcErr) {
      setError(`Could not delete account: ${rpcErr.message}`);
      setBusy(false);
      return;
    }
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <section className="bg-red/5 border border-red/30 rounded-2xl p-6">
      <h2 className="font-serif text-2xl mb-2 text-red">Danger zone</h2>
      <p className="text-sm text-offwhite/70 mb-4">
        Delete your account and all associated data — deals, capital sources, compliance items,
        milestones, stakeholders, activity, conversations, and belief capital moments. This cannot
        be undone.
      </p>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm px-4 py-2 rounded-lg border border-red/30 text-red hover:bg-red/10 transition"
        >
          Delete my account
        </button>
      ) : (
        <div className="space-y-3 bg-charcoal/40 border border-red/30 rounded-xl p-4">
          <p className="text-sm text-offwhite/90">
            You&apos;re about to permanently delete <strong>{userEmail}</strong> and all your data.
          </p>
          <div>
            <label className="block text-xs text-midgray mb-1">
              Type <span className="font-mono text-offwhite">delete my account</span> to confirm:
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="delete my account"
              className="w-full bg-charcoal/60 border border-red/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red"
            />
          </div>
          {error && <p className="text-xs text-red">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={deleteAccount}
              disabled={busy || typed.trim().toLowerCase() !== 'delete my account'}
              className="bg-red hover:bg-red-dark text-offwhite px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {busy ? 'Deleting…' : 'Permanently delete'}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setTyped('');
                setError(null);
              }}
              className="text-midgray hover:text-offwhite px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
