'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import { recalculateAndPersistRIS } from '@/lib/ris/recalculate';
import { useCollapse } from '@/lib/hooks/useCollapse';
import type { Stakeholder } from '@/lib/types';
import AddStakeholderForm from './AddStakeholderForm';
import SectionToggle from './SectionToggle';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-teal/15 text-teal border-teal/30',
  pending: 'bg-amber/15 text-amber border-amber/30',
  inactive: 'bg-charcoal/60 text-midgray border-midgray/30',
};

export default function StakeholderPanel({
  stakeholders,
  dealId,
}: {
  stakeholders: Stakeholder[];
  dealId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [collapsed, toggleCollapse] = useCollapse(`stakeholders-${dealId}`, false);
  const totalActions = stakeholders.reduce((sum, s) => sum + (s.action_items ?? 0), 0);

  async function deleteStakeholder(s: Stakeholder) {
    if (!confirm(`Remove ${s.name} from this deal?`)) return;
    setBusyId(s.id);
    await supabase.from('deal_stakeholders').delete().eq('id', s.id);
    await logActivity(supabase, {
      dealId,
      action: `Removed stakeholder: ${s.name}`,
      type: 'stakeholder',
    });
    await recalculateAndPersistRIS(supabase, dealId);
    setBusyId(null);
    router.refresh();
  }

  return (
    <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl overflow-hidden">
      <div className={`px-6 py-4 flex items-center justify-between gap-3 ${collapsed ? '' : 'border-b border-teal-mid/20'}`}>
        <button
          onClick={toggleCollapse}
          className="flex items-center gap-3 text-left flex-1 min-w-0 hover:text-teal-light transition"
        >
          <SectionToggle collapsed={collapsed} />
          <div className="min-w-0">
            <h2 className="font-serif text-xl">Stakeholders</h2>
            <p className="text-midgray text-xs">
              {stakeholders.length} active{totalActions > 0 ? ` · ${totalActions} action item${totalActions === 1 ? '' : 's'}` : ''}
            </p>
          </div>
        </button>
        <button
          onClick={() => {
            if (collapsed) toggleCollapse();
            setAdding(!adding);
          }}
          className="text-xs bg-teal hover:bg-teal-mid text-offwhite px-3 py-1.5 rounded-lg font-medium shrink-0"
        >
          {adding ? 'Close' : '+ Add stakeholder'}
        </button>
      </div>
      {adding && (
        <AddStakeholderForm
          dealId={dealId}
          onClose={() => setAdding(false)}
        />
      )}
      {!collapsed && (
      <ul className="divide-y divide-teal-mid/15">
        {stakeholders.map((s) => {
          const style = STATUS_STYLES[s.status] ?? STATUS_STYLES.active;
          if (editingId === s.id) {
            return (
              <li key={s.id}>
                <AddStakeholderForm
                  dealId={dealId}
                  existing={s}
                  onClose={() => setEditingId(null)}
                />
              </li>
            );
          }
          return (
            <li key={s.id} className="group px-6 py-3 flex items-center gap-3 hover:bg-charcoal/40 transition">
              <div className="w-9 h-9 rounded-full bg-teal-mid/30 flex items-center justify-center text-xs font-medium">
                {s.name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-midgray truncate">{s.role}</div>
              </div>
              <div className="flex items-center gap-2">
                {s.action_items > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/30">
                    {s.action_items} action
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full border ${style}`}>{s.status}</span>
                <button
                  onClick={() => setEditingId(s.id)}
                  title="Edit"
                  className="opacity-0 group-hover:opacity-100 text-midgray hover:text-teal text-sm leading-none px-1 transition"
                >
                  ✎
                </button>
                <button
                  onClick={() => deleteStakeholder(s)}
                  disabled={busyId === s.id}
                  title="Remove"
                  className="opacity-0 group-hover:opacity-100 text-midgray hover:text-red text-base leading-none px-1 transition disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      )}
    </section>
  );
}
