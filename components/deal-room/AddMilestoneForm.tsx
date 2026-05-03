'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import { recalculateAndPersistRIS } from '@/lib/ris/recalculate';
import type { Milestone } from '@/lib/types';

const STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Done' },
];

export default function AddMilestoneForm({
  dealId,
  nextSortOrder,
  existing,
  onClose,
}: {
  dealId: string;
  nextSortOrder?: number;
  existing?: Milestone;
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(existing?.name ?? '');
  const [status, setStatus] = useState(existing?.status ?? 'todo');
  const [targetDate, setTargetDate] = useState(existing?.target_date ?? '');

  const isEdit = !!existing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let err: string | null = null;
    if (isEdit && existing) {
      const { error } = await supabase
        .from('milestones')
        .update({
          name,
          status,
          target_date: targetDate || null,
          completed_date: status === 'done' ? new Date().toISOString().slice(0, 10) : null,
        })
        .eq('id', existing.id);
      err = error?.message ?? null;
    } else {
      const { error } = await supabase.from('milestones').insert({
        deal_id: dealId,
        name,
        status,
        target_date: targetDate || null,
        sort_order: nextSortOrder ?? 0,
      });
      err = error?.message ?? null;
    }

    if (err) {
      setLoading(false);
      setError(err);
      return;
    }
    await logActivity(supabase, {
      dealId,
      action: isEdit
        ? `Updated milestone "${name}"${targetDate ? ` — target ${targetDate}` : ''} (${status})`
        : `Added milestone "${name}"${targetDate ? ` — target ${targetDate}` : ''}`,
    });
    await recalculateAndPersistRIS(supabase, dealId);
    setLoading(false);
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-charcoal/60 border-t border-teal-mid/30">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Milestone name"
          className="sm:col-span-3 bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
        />
        <input
          type="date"
          value={targetDate ?? ''}
          onChange={(e) => setTargetDate(e.target.value)}
          className="bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:col-span-2 bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-red text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal hover:bg-teal-mid text-offwhite px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add milestone'}
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
