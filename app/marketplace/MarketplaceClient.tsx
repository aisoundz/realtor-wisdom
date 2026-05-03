'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { MarketplaceSource, ScoringDeal } from '@/lib/marketplace/scoring';
import { scoreSourcesForDeal } from '@/lib/marketplace/scoring';

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
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export default function MarketplaceClient({
  sources,
  deals,
}: {
  sources: MarketplaceSource[];
  deals: ScoringDeal[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedDealId, setSelectedDealId] = useState<string>(deals[0]?.id ?? '');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [addError, setAddError] = useState<string | null>(null);

  async function addToStack(source: MarketplaceSource) {
    if (!selectedDealId) return;
    setAdding(source.id);
    setAddError(null);

    // Determine the next sort_order for the deal's capital stack
    const { data: existing } = await supabase
      .from('capital_sources')
      .select('sort_order')
      .eq('deal_id', selectedDealId)
      .order('sort_order', { ascending: false })
      .limit(1);
    const nextSortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    const initialAmount = source.min_amount ?? 0;
    const { error } = await supabase.from('capital_sources').insert({
      deal_id: selectedDealId,
      name: source.name,
      source_type: source.source_type,
      committed_amount: initialAmount,
      status: 'requested',
      notes: source.description ?? null,
      sort_order: nextSortOrder,
    });

    if (error) {
      setAddError(`Could not add ${source.name}: ${error.message}`);
      setAdding(null);
      return;
    }

    // Log activity
    const dealOrgId = await supabase
      .from('deals')
      .select('org_id')
      .eq('id', selectedDealId)
      .single()
      .then((r) => r.data?.org_id ?? null);

    await supabase.from('activity_log').insert({
      deal_id: selectedDealId,
      org_id: dealOrgId,
      actor: 'You',
      action: `Added ${source.name} (${source.source_type ?? 'source'}) to capital stack from marketplace`,
      type: 'system',
    });

    setAdded((prev) => new Set(prev).add(source.id));
    setAdding(null);
    router.refresh();
  }

  const selectedDeal = deals.find((d) => d.id === selectedDealId);

  const matches = useMemo(() => {
    if (!selectedDeal) return [];
    return scoreSourcesForDeal(sources, selectedDeal);
  }, [sources, selectedDeal]);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return matches;
    return matches.filter((m) => m.source.source_type === typeFilter);
  }, [matches, typeFilter]);

  const types = Array.from(
    new Set(sources.map((s) => s.source_type).filter(Boolean) as string[])
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-5 flex flex-wrap gap-4 items-center">
        {deals.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-xs uppercase tracking-wider text-midgray">Match against</label>
            <select
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(e.target.value)}
              className="bg-charcoal/60 border border-teal-mid/30 text-offwhite text-sm px-3 py-2 rounded-lg"
            >
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <label className="text-xs uppercase tracking-wider text-midgray">Filter</label>
          <button
            onClick={() => setTypeFilter('all')}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              typeFilter === 'all'
                ? 'bg-teal/15 text-teal border-teal/40'
                : 'border-midgray/30 text-midgray hover:border-midgray/60'
            }`}
          >
            All
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                typeFilter === t
                  ? 'bg-teal/15 text-teal border-teal/40'
                  : 'border-midgray/30 text-midgray hover:border-midgray/60'
              }`}
            >
              {SOURCE_TYPE_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Match cards */}
      {filtered.length === 0 ? (
        <div className="text-center text-midgray py-12">
          No sources match this filter. Try removing the type filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(({ source, score, reasons }) => {
            const tierLabel = score >= 80 ? 'Strong fit' : score >= 60 ? 'Good fit' : 'Weak fit';
            const tierColor =
              score >= 80 ? 'text-teal' : score >= 60 ? 'text-amber' : 'text-red';
            return (
              <div
                key={source.id}
                className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-5 hover:border-teal/40 transition"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-serif text-lg leading-tight">{source.name}</h3>
                    <div className="text-xs text-midgray mt-0.5">
                      {source.source_type
                        ? SOURCE_TYPE_LABELS[source.source_type] ?? source.source_type
                        : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-serif text-2xl ${tierColor}`}>{score}</div>
                    <div className={`text-xs ${tierColor}`}>{tierLabel}</div>
                  </div>
                </div>
                {source.description && (
                  <p className="text-sm text-offwhite/75 leading-snug mb-3">{source.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {reasons.map((r) => (
                    <span
                      key={r}
                      className="text-xs px-2 py-0.5 rounded-full bg-charcoal/60 border border-teal-mid/30 text-midgray"
                    >
                      {r}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-midgray pt-3 border-t border-teal-mid/15">
                  <span>
                    {formatMoney(source.min_amount)} – {formatMoney(source.max_amount)}
                  </span>
                  {added.has(source.id) ? (
                    <a
                      href={`/deals/${selectedDealId}`}
                      className="text-teal-light font-medium"
                    >
                      ✓ Added — view in deal →
                    </a>
                  ) : (
                    <button
                      onClick={() => addToStack(source)}
                      disabled={adding === source.id || !selectedDealId}
                      className="text-teal hover:text-teal-light font-medium disabled:opacity-50"
                    >
                      {adding === source.id ? 'Adding…' : 'Add to stack →'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {addError && (
        <div className="bg-red/10 border border-red/30 text-red px-4 py-3 rounded-lg text-sm">
          {addError}
        </div>
      )}
    </div>
  );
}
