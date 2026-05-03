'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import type { Milestone } from '@/lib/types';
import AddMilestoneForm from './AddMilestoneForm';

const MILESTONE_CYCLE = ['todo', 'active', 'done'];

const STATUS_STYLES: Record<string, string> = {
  done: 'bg-teal text-offwhite border-teal',
  active: 'bg-amber text-charcoal border-amber',
  todo: 'bg-charcoal/60 text-midgray border-midgray/40',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MilestoneTimeline({
  milestones,
  onSelect,
  dealId,
}: {
  milestones: Milestone[];
  onSelect: (m: Milestone) => void;
  dealId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const nextSortOrder = milestones.length > 0 ? Math.max(...milestones.map((m) => m.sort_order)) + 1 : 0;

  async function cycleStatus(m: Milestone, e: React.MouseEvent) {
    e.stopPropagation();
    setBusyId(m.id);
    const idx = MILESTONE_CYCLE.indexOf(m.status);
    const next = MILESTONE_CYCLE[(idx + 1) % MILESTONE_CYCLE.length];
    const update: { status: string; completed_date: string | null } = {
      status: next,
      completed_date: next === 'done' ? new Date().toISOString().slice(0, 10) : null,
    };
    await supabase.from('milestones').update(update).eq('id', m.id);
    await logActivity(supabase, {
      dealId,
      action: `Updated milestone "${m.name}": ${m.status} → ${next}`,
    });
    setBusyId(null);
    router.refresh();
  }

  async function deleteMilestone(m: Milestone, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Remove milestone "${m.name}"?`)) return;
    setBusyId(m.id);
    await supabase.from('milestones').delete().eq('id', m.id);
    await logActivity(supabase, {
      dealId,
      action: `Removed milestone: "${m.name}"`,
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-teal-mid/20 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl">Milestones</h2>
          <p className="text-midgray text-xs">From LOI to stabilization</p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="text-xs bg-teal hover:bg-teal-mid text-offwhite px-3 py-1.5 rounded-lg font-medium"
        >
          {adding ? 'Close' : '+ Add milestone'}
        </button>
      </div>
      {adding && (
        <AddMilestoneForm
          dealId={dealId}
          nextSortOrder={nextSortOrder}
          onClose={() => setAdding(false)}
        />
      )}
      <ol className="px-6 py-6 space-y-4">
        {milestones.map((m, idx) => {
          const styleCircle = STATUS_STYLES[m.status] ?? STATUS_STYLES.todo;
          if (editingId === m.id) {
            return (
              <li key={m.id} className="-mx-6">
                <AddMilestoneForm
                  dealId={dealId}
                  existing={m}
                  onClose={() => setEditingId(null)}
                />
              </li>
            );
          }
          return (
            <li
              key={m.id}
              onClick={() => onSelect(m)}
              className="relative flex items-start gap-4 cursor-pointer group hover:bg-charcoal/40 -mx-2 px-2 py-2 rounded transition"
            >
              {idx < milestones.length - 1 && (
                <span className="absolute left-[19px] top-9 bottom-0 w-px bg-teal-mid/30" />
              )}
              <button
                onClick={(e) => cycleStatus(m, e)}
                disabled={busyId === m.id}
                title="Click to cycle status"
                className={`relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-medium ${styleCircle} hover:opacity-80 transition disabled:opacity-50`}
              >
                {m.status === 'done' ? '✓' : idx + 1}
              </button>
              <div className="flex-1 pt-1">
                <div className="font-medium text-sm">{m.name}</div>
                <div className="text-xs text-midgray mt-0.5">
                  {m.status === 'done' && m.completed_date
                    ? `Completed ${formatDate(m.completed_date)}`
                    : `Target ${formatDate(m.target_date)}`}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(m.id);
                }}
                title="Edit"
                className="opacity-0 group-hover:opacity-100 text-midgray hover:text-teal text-sm leading-none px-1 transition self-start mt-1"
              >
                ✎
              </button>
              <button
                onClick={(e) => deleteMilestone(m, e)}
                title="Remove"
                className="opacity-0 group-hover:opacity-100 text-midgray hover:text-red text-base leading-none px-1 transition self-start mt-1"
              >
                ×
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
