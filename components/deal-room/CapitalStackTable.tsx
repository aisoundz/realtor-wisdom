'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import { recalculateAndPersistRIS } from '@/lib/ris/recalculate';
import type { CapitalSource } from '@/lib/types';
import AddCapitalSourceForm from './AddCapitalSourceForm';

const STATUS_CYCLE = ['pending', 'in_loi', 'approved', 'confirmed', 'requested', 'gap'];

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  approved: { label: 'Approved', className: 'bg-teal/15 text-teal border-teal/30' },
  confirmed: { label: 'Confirmed', className: 'bg-teal/15 text-teal border-teal/30' },
  pending: { label: 'Pending', className: 'bg-amber/15 text-amber border-amber/30' },
  in_loi: { label: 'In LOI', className: 'bg-amber/15 text-amber border-amber/30' },
  requested: { label: 'Requested', className: 'bg-blue/15 text-blue border-blue/30' },
  gap: { label: 'Gap', className: 'bg-red/15 text-red border-red/30' },
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  impact_loan: 'Impact loan',
  cdfi: 'CDFI loan',
  tif: 'TIF',
  nmtc: 'NMTC equity',
  grant: 'Grant',
  equity: 'Equity',
  ti_prepaid: 'TI prepaid',
  pri: 'PRI',
  developer_equity: 'Developer equity',
  other: 'Other',
};

function formatMoney(amount: number | null): string {
  if (amount == null) return '—';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export default function CapitalStackTable({
  sources,
  selectedId,
  onSelect,
  dealId,
}: {
  sources: CapitalSource[];
  selectedId: string | null;
  onSelect: (source: CapitalSource) => void;
  dealId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const nextSortOrder = sources.length > 0 ? Math.max(...sources.map((s) => s.sort_order)) + 1 : 0;

  async function cycleStatus(s: CapitalSource, e: React.MouseEvent) {
    e.stopPropagation();
    setBusyId(s.id);
    const idx = STATUS_CYCLE.indexOf(s.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    await supabase.from('capital_sources').update({ status: next }).eq('id', s.id);
    await logActivity(supabase, {
      dealId,
      action: `Updated ${s.name} status: ${s.status} → ${next}`,
    });
    await recalculateAndPersistRIS(supabase, dealId);
    setBusyId(null);
    router.refresh();
  }

  async function deleteSource(s: CapitalSource, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Remove ${s.name} from the capital stack?`)) return;
    setBusyId(s.id);
    await supabase.from('capital_sources').delete().eq('id', s.id);
    await logActivity(supabase, {
      dealId,
      action: `Removed ${s.name} from capital stack`,
    });
    await recalculateAndPersistRIS(supabase, dealId);
    setBusyId(null);
    router.refresh();
  }

  return (
    <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-teal-mid/20 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl">Capital stack</h2>
          <p className="text-midgray text-xs">Click any row to ask Real Wisdom about it</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-midgray">{sources.length} sources</span>
          <button
            onClick={() => setAdding(!adding)}
            className="text-xs bg-teal hover:bg-teal-mid text-offwhite px-3 py-1.5 rounded-lg font-medium"
          >
            {adding ? 'Close' : '+ Add source'}
          </button>
        </div>
      </div>
      {adding && (
        <AddCapitalSourceForm
          dealId={dealId}
          nextSortOrder={nextSortOrder}
          onClose={() => setAdding(false)}
        />
      )}
      <ul>
        {sources.map((s) => {
          const style = STATUS_STYLES[s.status] ?? STATUS_STYLES.pending;
          const isSelected = selectedId === s.id;
          if (editingId === s.id) {
            return (
              <li key={s.id} className="border-b last:border-b-0 border-teal-mid/15">
                <AddCapitalSourceForm
                  dealId={dealId}
                  existing={s}
                  onClose={() => setEditingId(null)}
                />
              </li>
            );
          }
          return (
            <li
              key={s.id}
              onClick={() => onSelect(s)}
              className={`px-6 py-4 border-b last:border-b-0 border-teal-mid/15 cursor-pointer transition group
                ${isSelected ? 'bg-purple/10 border-l-4 border-l-purple' : 'hover:bg-charcoal/50 border-l-4 border-l-transparent'}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-medium text-base">{s.name}</span>
                    <button
                      onClick={(e) => cycleStatus(s, e)}
                      disabled={busyId === s.id}
                      title="Click to cycle status"
                      className={`text-xs px-2 py-0.5 rounded-full border transition hover:opacity-80 ${style.className} disabled:opacity-50`}
                    >
                      {busyId === s.id ? '…' : style.label}
                    </button>
                  </div>
                  <div className="text-xs text-midgray">
                    {s.source_type ? SOURCE_TYPE_LABELS[s.source_type] ?? s.source_type : ''}
                  </div>
                  {s.notes && (
                    <p className="text-sm text-offwhite/70 mt-2 leading-snug">{s.notes}</p>
                  )}
                </div>
                <div className="text-right shrink-0 flex items-start gap-2">
                  <div>
                    <div className="font-serif text-xl">{formatMoney(s.committed_amount)}</div>
                    <div className="text-xs text-purple/70 opacity-0 group-hover:opacity-100 transition">
                      Ask Wisdom →
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(s.id);
                    }}
                    title="Edit"
                    className="opacity-0 group-hover:opacity-100 text-midgray hover:text-teal text-sm leading-none px-1 transition"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => deleteSource(s, e)}
                    title="Remove"
                    className="opacity-0 group-hover:opacity-100 text-midgray hover:text-red text-lg leading-none px-1 transition"
                  >
                    ×
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
