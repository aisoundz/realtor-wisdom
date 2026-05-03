'use client';

import type { CapitalSource } from '@/lib/types';

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
}: {
  sources: CapitalSource[];
  selectedId: string | null;
  onSelect: (source: CapitalSource) => void;
}) {
  return (
    <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-teal-mid/20 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl">Capital stack</h2>
          <p className="text-midgray text-xs">Click any row to ask Real Wisdom about it</p>
        </div>
        <span className="text-xs text-midgray">{sources.length} sources</span>
      </div>
      <ul>
        {sources.map((s) => {
          const style = STATUS_STYLES[s.status] ?? STATUS_STYLES.pending;
          const isSelected = selectedId === s.id;
          return (
            <li
              key={s.id}
              onClick={() => onSelect(s)}
              className={`px-6 py-4 border-b last:border-b-0 border-teal-mid/15 cursor-pointer transition group
                ${isSelected ? 'bg-purple/10 border-l-4 border-l-purple' : 'hover:bg-charcoal/50 border-l-4 border-l-transparent'}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-base">{s.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${style.className}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className="text-xs text-midgray">
                    {s.source_type ? SOURCE_TYPE_LABELS[s.source_type] ?? s.source_type : ''}
                  </div>
                  {s.notes && (
                    <p className="text-sm text-offwhite/70 mt-2 leading-snug">{s.notes}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-serif text-xl">{formatMoney(s.committed_amount)}</div>
                  <div className="text-xs text-purple/70 opacity-0 group-hover:opacity-100 transition">
                    Ask Wisdom →
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
