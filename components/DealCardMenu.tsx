'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function DealCardMenu({
  dealId,
  dealName,
  isPublic,
}: {
  dealId: string;
  dealName: string;
  isPublic: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Permanently delete "${dealName}"?\n\nThis removes the deal and ALL associated data — capital sources, compliance items, milestones, stakeholders, activity, and conversations. Cannot be undone.`)) {
      return;
    }
    setBusy(true);
    // Cascade: deal_id has ON DELETE CASCADE on capital_sources, checklist_items,
    // milestones, deal_stakeholders, wisdom_conversations. activity_log + belief
    // moments don't cascade — clean those up manually first.
    await supabase.from('activity_log').delete().eq('deal_id', dealId);
    await supabase.from('belief_capital_moments').delete().eq('deal_id', dealId);
    await supabase.from('deals').delete().eq('id', dealId);
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  async function togglePublic(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    await supabase.from('deals').update({ is_public: !isPublic }).eq('id', dealId);
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  async function copyShareLink(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/deals/${dealId}/public`;
    await navigator.clipboard.writeText(url);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        title="Deal actions"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-midgray hover:text-offwhite hover:bg-charcoal/60 transition"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="3" cy="8" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="13" cy="8" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-charcoal border border-teal-mid/40 rounded-xl shadow-xl py-1 z-30">
          <Link
            href={`/deals/${dealId}`}
            onClick={(e) => e.stopPropagation()}
            className="block px-4 py-2 text-sm hover:bg-charcoal/60"
          >
            Open deal
          </Link>
          <button
            onClick={togglePublic}
            disabled={busy}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-charcoal/60 disabled:opacity-50"
          >
            {isPublic ? 'Make private' : 'Make public'}
          </button>
          {isPublic && (
            <button
              onClick={copyShareLink}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-charcoal/60"
            >
              🔗 Copy share link
            </button>
          )}
          <div className="border-t border-teal-mid/30 my-1" />
          <button
            onClick={handleDelete}
            disabled={busy}
            className="block w-full text-left px-4 py-2 text-sm text-red hover:bg-red/10 disabled:opacity-50"
          >
            {busy ? 'Deleting…' : 'Delete deal'}
          </button>
        </div>
      )}
    </div>
  );
}
