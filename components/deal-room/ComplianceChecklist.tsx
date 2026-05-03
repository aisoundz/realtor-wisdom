'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import type { ChecklistItem } from '@/lib/types';
import AddChecklistItemForm from './AddChecklistItemForm';

const PHASE_LABELS: Record<string, string> = {
  pre_development: 'Pre-development',
  capital_stack: 'Capital stack',
  construction_close: 'Construction close',
  post_close: 'Post-close',
};

const STATUS_DOT: Record<string, string> = {
  done: 'bg-teal',
  pending: 'bg-amber',
  blocked: 'bg-red',
  todo: 'bg-charcoal border border-midgray/40',
};

export default function ComplianceChecklist({
  items,
  onSelect,
  dealId,
}: {
  items: ChecklistItem[];
  onSelect: (item: ChecklistItem) => void;
  dealId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleDone(item: ChecklistItem, e: React.MouseEvent) {
    e.stopPropagation();
    setBusyId(item.id);
    const next = item.status === 'done' ? 'todo' : 'done';
    await supabase
      .from('checklist_items')
      .update({ status: next, completed_at: next === 'done' ? new Date().toISOString() : null })
      .eq('id', item.id);
    await logActivity(supabase, {
      dealId,
      action: next === 'done' ? `Completed: "${item.name}"` : `Reopened: "${item.name}"`,
    });
    setBusyId(null);
    router.refresh();
  }

  async function deleteItem(item: ChecklistItem, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Remove "${item.name}" from the checklist?`)) return;
    setBusyId(item.id);
    await supabase.from('checklist_items').delete().eq('id', item.id);
    await logActivity(supabase, {
      dealId,
      action: `Removed compliance item: "${item.name}"`,
    });
    setBusyId(null);
    router.refresh();
  }
  // Group by phase
  const byPhase = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const k = item.phase ?? 'unknown';
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});

  const phaseOrder = ['pre_development', 'capital_stack', 'construction_close', 'post_close'];

  const blockingCount = items.filter((i) => i.blocking_close && i.status !== 'done').length;

  return (
    <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-teal-mid/20 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl">Compliance checklist</h2>
          <p className="text-midgray text-xs">Click an item to ask Real Wisdom</p>
        </div>
        <div className="flex items-center gap-3">
          {blockingCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-red/15 text-red border border-red/30">
              {blockingCount} blocking close
            </span>
          )}
          <button
            onClick={() => setAdding(!adding)}
            className="text-xs bg-teal hover:bg-teal-mid text-offwhite px-3 py-1.5 rounded-lg font-medium"
          >
            {adding ? 'Close' : '+ Add item'}
          </button>
        </div>
      </div>
      {adding && (
        <AddChecklistItemForm
          dealId={dealId}
          onClose={() => setAdding(false)}
        />
      )}
      <div className="divide-y divide-teal-mid/15">
        {phaseOrder
          .filter((p) => byPhase[p]?.length)
          .map((phase) => {
            const phaseItems = byPhase[phase];
            const doneCount = phaseItems.filter((i) => i.status === 'done').length;
            return (
              <div key={phase} className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-midgray">
                    {PHASE_LABELS[phase] ?? phase}
                  </h3>
                  <span className="text-xs text-midgray">
                    {doneCount}/{phaseItems.length}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {phaseItems.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => onSelect(item)}
                      className="group flex items-start gap-3 py-1.5 cursor-pointer hover:bg-charcoal/40 -mx-2 px-2 rounded transition"
                    >
                      <button
                        onClick={(e) => toggleDone(item, e)}
                        disabled={busyId === item.id}
                        title={item.status === 'done' ? 'Mark incomplete' : 'Mark done'}
                        className={`w-4 h-4 rounded-full mt-1 flex-shrink-0 flex items-center justify-center transition border ${
                          item.status === 'done'
                            ? 'bg-teal border-teal text-charcoal'
                            : item.status === 'pending'
                              ? 'bg-amber border-amber'
                              : item.status === 'blocked'
                                ? 'bg-red border-red'
                                : 'bg-transparent border-midgray/40 hover:border-teal'
                        }`}
                      >
                        {item.status === 'done' && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm ${item.status === 'done' ? 'text-midgray line-through' : ''}`}>
                            {item.name}
                          </span>
                          {item.blocking_close && item.status !== 'done' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red/15 text-red border border-red/30">
                              blocks close
                            </span>
                          )}
                        </div>
                        {item.notes && <p className="text-xs text-midgray mt-0.5">{item.notes}</p>}
                      </div>
                      <button
                        onClick={(e) => deleteItem(item, e)}
                        title="Remove"
                        className="opacity-0 group-hover:opacity-100 text-midgray hover:text-red text-base leading-none px-1 transition self-start mt-0.5"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
      </div>
    </section>
  );
}
