'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DeleteDealButton({
  dealId,
  dealName,
}: {
  dealId: string;
  dealName: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [typedName, setTypedName] = useState('');

  async function handleDelete() {
    if (typedName.trim() !== dealName) {
      setError(`Please type the deal name "${dealName}" exactly to confirm.`);
      return;
    }
    setBusy(true);
    setError(null);
    // Cascade: deal_id has ON DELETE CASCADE on capital_sources, checklist_items,
    // milestones, deal_stakeholders. activity_log + belief_capital_moments don't
    // cascade — clean those up manually so we don't leak orphaned rows.
    await supabase.from('activity_log').delete().eq('deal_id', dealId);
    await supabase.from('belief_capital_moments').delete().eq('deal_id', dealId);
    const { error: delErr } = await supabase.from('deals').delete().eq('id', dealId);
    if (delErr) {
      setError(delErr.message);
      setBusy(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs px-3 py-1.5 rounded-lg border border-red/30 text-red hover:bg-red/10 transition"
      >
        Delete deal
      </button>
    );
  }

  return (
    <div className="bg-red/5 border border-red/30 rounded-xl p-4 space-y-3 max-w-md">
      <h3 className="font-medium text-red">Delete this deal permanently?</h3>
      <p className="text-xs text-offwhite/70 leading-relaxed">
        This removes the deal and all its capital sources, compliance items, milestones,
        stakeholders, activity log, and belief capital moments. <strong className="text-red">This cannot be undone.</strong>
      </p>
      <div>
        <label className="text-xs text-midgray block mb-1">
          Type <span className="font-mono text-offwhite">{dealName}</span> to confirm:
        </label>
        <input
          type="text"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder={dealName}
          className="w-full bg-charcoal/60 border border-red/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red"
        />
      </div>
      {error && <p className="text-xs text-red">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={busy || typedName.trim() !== dealName}
          className="bg-red hover:bg-red-dark text-offwhite px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Deleting…' : 'Permanently delete'}
        </button>
        <button
          onClick={() => {
            setConfirming(false);
            setTypedName('');
            setError(null);
          }}
          className="text-midgray hover:text-offwhite px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
