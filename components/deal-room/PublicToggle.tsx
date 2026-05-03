'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';

export default function PublicToggle({
  dealId,
  isPublic,
}: {
  dealId: string;
  isPublic: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !isPublic;
    await supabase.from('deals').update({ is_public: next }).eq('id', dealId);
    await logActivity(supabase, {
      dealId,
      action: next
        ? 'Made deal profile public — shareable URL active'
        : 'Made deal profile private',
    });
    setBusy(false);
    router.refresh();
  }

  async function copyLink() {
    const url = `${window.location.origin}/deals/${dealId}/public`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      {isPublic && (
        <button
          onClick={copyLink}
          title="Copy public URL"
          className="text-xs px-2.5 py-1 rounded-full bg-teal/15 text-teal border border-teal/30 hover:bg-teal/25 transition"
        >
          {copied ? '✓ Copied' : '🔗 Copy share link'}
        </button>
      )}
      <button
        onClick={toggle}
        disabled={busy}
        title={isPublic ? 'Make private' : 'Make public — anyone with the link can view'}
        className={`text-xs px-2.5 py-1 rounded-full border transition disabled:opacity-50 ${
          isPublic
            ? 'bg-amber/15 text-amber border-amber/30 hover:bg-amber/25'
            : 'bg-charcoal/40 text-midgray border-midgray/30 hover:text-offwhite'
        }`}
      >
        {busy ? '…' : isPublic ? 'Public · click to make private' : 'Make public'}
      </button>
    </div>
  );
}
