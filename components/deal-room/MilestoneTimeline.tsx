'use client';

import { useState } from 'react';
import type { Milestone } from '@/lib/types';
import AddMilestoneForm from './AddMilestoneForm';

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
  const [adding, setAdding] = useState(false);
  const nextSortOrder = milestones.length > 0 ? Math.max(...milestones.map((m) => m.sort_order)) + 1 : 0;

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
          return (
            <li
              key={m.id}
              onClick={() => onSelect(m)}
              className="relative flex items-start gap-4 cursor-pointer group hover:bg-charcoal/40 -mx-2 px-2 py-2 rounded transition"
            >
              {idx < milestones.length - 1 && (
                <span className="absolute left-[19px] top-9 bottom-0 w-px bg-teal-mid/30" />
              )}
              <span
                className={`relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-medium ${styleCircle}`}
              >
                {m.status === 'done' ? '✓' : idx + 1}
              </span>
              <div className="flex-1 pt-1">
                <div className="font-medium text-sm">{m.name}</div>
                <div className="text-xs text-midgray mt-0.5">
                  {m.status === 'done' && m.completed_date
                    ? `Completed ${formatDate(m.completed_date)}`
                    : `Target ${formatDate(m.target_date)}`}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
