import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateRIS, type RISResult } from './calculate';

// Fetches all deal data, computes RIS, persists composite to deals.real_impact_score.
// Called from any form/action that mutates a deal so dashboards stay fresh.
export async function recalculateAndPersistRIS(
  supabase: SupabaseClient,
  dealId: string
): Promise<RISResult | null> {
  const [
    { data: deal },
    { data: capitalSources },
    { data: checklist },
    { data: milestones },
    { data: stakeholders },
    { data: beliefMoments },
  ] = await Promise.all([
    supabase
      .from('deals')
      .select('unit_count, ami_targeting, total_cost, health_score')
      .eq('id', dealId)
      .single(),
    supabase.from('capital_sources').select('*').eq('deal_id', dealId),
    supabase.from('checklist_items').select('*').eq('deal_id', dealId),
    supabase.from('milestones').select('*').eq('deal_id', dealId),
    supabase.from('deal_stakeholders').select('*').eq('deal_id', dealId),
    supabase
      .from('belief_capital_moments')
      .select('id, moment_type, downstream_value')
      .eq('deal_id', dealId),
  ]);

  if (!deal) return null;

  const ris = calculateRIS({
    deal,
    capitalSources: capitalSources ?? [],
    checklist: checklist ?? [],
    milestones: milestones ?? [],
    stakeholders: stakeholders ?? [],
    beliefMoments: beliefMoments ?? [],
  });

  await supabase
    .from('deals')
    .update({ real_impact_score: ris.composite })
    .eq('id', dealId);

  return ris;
}
