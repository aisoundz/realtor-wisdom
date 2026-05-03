import type { SupabaseClient } from '@supabase/supabase-js';

// Helper: log an activity entry for a deal. Used by every form that mutates
// deal data so the activity feed reflects what actually happened.
export async function logActivity(
  supabase: SupabaseClient,
  params: {
    dealId: string;
    actor?: string;
    action: string;
    type?: 'system' | 'real_wisdom' | 'stakeholder' | 'belief_capital';
  }
) {
  // Look up org_id from the deal so the activity_log row links cleanly
  const { data: deal } = await supabase
    .from('deals')
    .select('org_id')
    .eq('id', params.dealId)
    .single();

  return supabase.from('activity_log').insert({
    deal_id: params.dealId,
    org_id: deal?.org_id ?? null,
    actor: params.actor ?? 'You',
    action: params.action,
    type: params.type ?? 'system',
  });
}
