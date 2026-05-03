'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import type { ChecklistItem } from '@/lib/types';

const PHASES = [
  { value: 'pre_development', label: 'Pre-development' },
  { value: 'capital_stack', label: 'Capital stack' },
  { value: 'construction_close', label: 'Construction close' },
  { value: 'post_close', label: 'Post-close' },
];

const STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'pending', label: 'Pending' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];

export default function AddChecklistItemForm({
  dealId,
  defaultPhase,
  existing,
  onClose,
}: {
  dealId: string;
  defaultPhase?: string;
  existing?: ChecklistItem;
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(existing?.name ?? '');
  const [phase, setPhase] = useState(existing?.phase ?? defaultPhase ?? 'pre_development');
  const [status, setStatus] = useState(existing?.status ?? 'todo');
  const [blockingClose, setBlockingClose] = useState(existing?.blocking_close ?? false);
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const isEdit = !!existing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let err: string | null = null;
    if (isEdit && existing) {
      const { error } = await supabase
        .from('checklist_items')
        .update({
          phase,
          name,
          status,
          blocking_close: blockingClose,
          notes: notes || null,
        })
        .eq('id', existing.id);
      err = error?.message ?? null;
    } else {
      const { error } = await supabase.from('checklist_items').insert({
        deal_id: dealId,
        phase,
        name,
        status,
        blocking_close: blockingClose,
        notes: notes || null,
        sort_order: 999,
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
        ? `Updated compliance item "${name}" (${phase.replace('_', ' ')}, ${status})`
        : `Added compliance item "${name}" (${phase.replace('_', ' ')}, ${status})${blockingClose ? ' — flagged as blocking construction close' : ''}`,
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
          placeholder="Item name (e.g. Title insurance commitment)"
          className="sm:col-span-2 bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
        />
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value)}
          className="bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
        >
          {PHASES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
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
      <label className="flex items-center gap-2 text-sm text-midgray">
        <input
          type="checkbox"
          checked={blockingClose}
          onChange={(e) => setBlockingClose(e.target.checked)}
          className="accent-red"
        />
        Blocks construction close
      </label>
      {error && <p className="text-red text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal hover:bg-teal-mid text-offwhite px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
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
