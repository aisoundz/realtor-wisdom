'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import type { CapitalSource } from '@/lib/types';

const SOURCE_TYPES = [
  { value: 'impact_loan', label: 'Impact loan' },
  { value: 'cdfi', label: 'CDFI loan' },
  { value: 'tif', label: 'TIF' },
  { value: 'nmtc', label: 'NMTC equity' },
  { value: 'grant', label: 'Grant' },
  { value: 'equity', label: 'Equity' },
  { value: 'ti_prepaid', label: 'TI prepaid' },
  { value: 'pri', label: 'PRI' },
  { value: 'developer_equity', label: 'Developer equity' },
  { value: 'other', label: 'Other' },
];

const STATUSES = [
  { value: 'approved', label: 'Approved' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_loi', label: 'In LOI' },
  { value: 'requested', label: 'Requested' },
  { value: 'gap', label: 'Gap' },
];

export default function AddCapitalSourceForm({
  dealId,
  nextSortOrder,
  existing,
  onClose,
}: {
  dealId: string;
  nextSortOrder?: number;
  existing?: CapitalSource;
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(existing?.name ?? '');
  const [sourceType, setSourceType] = useState(existing?.source_type ?? 'cdfi');
  const [amount, setAmount] = useState(existing?.committed_amount ? String(existing.committed_amount) : '');
  const [status, setStatus] = useState(existing?.status ?? 'pending');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const isEdit = !!existing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const amountNum = amount ? Number(amount.replace(/[^0-9]/g, '')) : 0;

    let err: string | null = null;
    if (isEdit && existing) {
      const { error } = await supabase
        .from('capital_sources')
        .update({
          name,
          source_type: sourceType,
          committed_amount: amountNum,
          status,
          notes: notes || null,
        })
        .eq('id', existing.id);
      err = error?.message ?? null;
    } else {
      const { error } = await supabase.from('capital_sources').insert({
        deal_id: dealId,
        name,
        source_type: sourceType,
        committed_amount: amountNum,
        status,
        notes: notes || null,
        sort_order: nextSortOrder ?? 0,
      });
      err = error?.message ?? null;
    }

    if (err) {
      setLoading(false);
      setError(err);
      return;
    }

    const dollars =
      amountNum >= 1_000_000
        ? `$${(amountNum / 1_000_000).toFixed(2)}M`
        : amountNum >= 1_000
          ? `$${(amountNum / 1_000).toFixed(0)}K`
          : `$${amountNum}`;
    await logActivity(supabase, {
      dealId,
      action: isEdit
        ? `Updated ${name} (${sourceType}, ${status}, ${dollars})`
        : `Added ${name} ${dollars} (${sourceType}, ${status}) to capital stack`,
    });
    setLoading(false);
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-charcoal/60 border-t border-teal-mid/30">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Source name (e.g. Apex Impact Fund)"
          className="bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
        />
        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
          className="bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
        >
          {SOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="$2,100,000"
          className="bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
      />
      {error && <p className="text-red text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal hover:bg-teal-mid text-offwhite px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add source'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-midgray hover:text-offwhite px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
