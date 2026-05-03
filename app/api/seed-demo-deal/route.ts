import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// One-click seed: creates the "Southside Commons" deal that mirrors the
// marketing site's Live Demo card — full capital stack, compliance, milestones,
// stakeholders, and activity. Run this once and the dashboard becomes a working
// demo of the whole product.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createServiceClient();

  // 1. Ensure the user has an org (create a personal one if missing)
  const { data: profile } = await admin
    .from('profiles')
    .select('id, org_id, name')
    .eq('id', user.id)
    .single();

  let orgId = profile?.org_id as string | null;
  if (!orgId) {
    const { data: newOrg, error: orgErr } = await admin
      .from('organizations')
      .insert({
        name: profile?.name ? `${profile.name}'s Organization` : 'My Organization',
        type: 'developer',
      })
      .select('id')
      .single();
    if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 });
    orgId = newOrg.id;
    await admin.from('profiles').update({ org_id: orgId }).eq('id', user.id);
  }

  // 2. Create the deal
  const { data: deal, error: dealErr } = await admin
    .from('deals')
    .insert({
      org_id: orgId,
      name: 'Southside Commons',
      address: '1234 South 5th Street',
      city: 'Detroit',
      state: 'MI',
      unit_count: 48,
      ami_targeting: '60% AMI',
      deal_type: 'mixed_use_affordable',
      total_cost: 7200000,
      status: 'active',
      health_score: 76,
      real_impact_score: 84,
      is_public: false,
    })
    .select('id')
    .single();
  if (dealErr) return NextResponse.json({ error: dealErr.message }, { status: 500 });

  const dealId = deal.id;

  // 3. Capital stack — matches the marketing demo card
  await admin.from('capital_sources').insert([
    {
      deal_id: dealId,
      name: 'Apex Impact Fund',
      source_type: 'impact_loan',
      committed_amount: 2100000,
      status: 'approved',
      notes: '+$400K available on your approved loan — Real Wisdom recommends drawing down before construction close to lower blended cost of capital',
      sort_order: 0,
    },
    {
      deal_id: dealId,
      name: 'Bridgeview CDFI',
      source_type: 'cdfi',
      committed_amount: 1200000,
      status: 'pending',
      notes: 'Doc missing — blocking close in 3 days. Form 8821 + draft op agreement needed by Friday',
      sort_order: 1,
    },
    {
      deal_id: dealId,
      name: 'Greenway NMTC Equity',
      source_type: 'nmtc',
      committed_amount: 1700000,
      status: 'in_loi',
      notes: '9 days to allocation commitment. CDE-side legal review in progress',
      sort_order: 2,
    },
    {
      deal_id: dealId,
      name: 'City of Detroit TIF',
      source_type: 'tif',
      committed_amount: 800000,
      status: 'approved',
      notes: 'PILOT and TIF approved by City Council 4/22',
      sort_order: 3,
    },
    {
      deal_id: dealId,
      name: 'Developer Equity',
      source_type: 'developer_equity',
      committed_amount: 100000,
      status: 'confirmed',
      sort_order: 4,
    },
    {
      deal_id: dealId,
      name: 'HUD HOME Funds (gap)',
      source_type: 'grant',
      committed_amount: 1300000,
      status: 'gap',
      notes: 'Application drafted — needs signoff from MSHDA before submission',
      sort_order: 5,
    },
  ]);

  // 4. Compliance checklist
  await admin.from('checklist_items').insert([
    { deal_id: dealId, phase: 'pre_development', name: 'Site control secured', status: 'done', sort_order: 0 },
    { deal_id: dealId, phase: 'pre_development', name: 'Environmental Phase I complete', status: 'done', sort_order: 1 },
    { deal_id: dealId, phase: 'pre_development', name: 'Zoning verified', status: 'done', sort_order: 2 },
    { deal_id: dealId, phase: 'pre_development', name: 'Architectural drawings (75% CDs)', status: 'pending', sort_order: 3 },
    { deal_id: dealId, phase: 'pre_development', name: 'Civil plans submitted', status: 'todo', sort_order: 4 },
    { deal_id: dealId, phase: 'capital_stack', name: 'Senior debt commitment (Apex)', status: 'done', sort_order: 0 },
    { deal_id: dealId, phase: 'capital_stack', name: 'Subordinate debt LOI (Bridgeview)', status: 'pending', sort_order: 1, notes: 'Doc gap is blocking — coordinated with Greenway' },
    { deal_id: dealId, phase: 'capital_stack', name: 'NMTC allocation letter (Greenway)', status: 'pending', sort_order: 2 },
    { deal_id: dealId, phase: 'capital_stack', name: 'Equity bridge term sheet', status: 'todo', sort_order: 3 },
    { deal_id: dealId, phase: 'capital_stack', name: 'Construction contingency funded', status: 'todo', sort_order: 4 },
    { deal_id: dealId, phase: 'construction_close', name: 'Title insurance commitment', status: 'todo', sort_order: 0 },
    { deal_id: dealId, phase: 'construction_close', name: 'Construction contract executed', status: 'todo', sort_order: 1 },
    { deal_id: dealId, phase: 'construction_close', name: 'Building permits issued', status: 'todo', sort_order: 2 },
    { deal_id: dealId, phase: 'construction_close', name: 'Bridgeview Form 8821 + op agreement', status: 'blocked', blocking_close: true, sort_order: 3, notes: 'Real Wisdom flagged — see capital stack' },
    { deal_id: dealId, phase: 'post_close', name: 'Construction draw schedule', status: 'todo', sort_order: 0 },
    { deal_id: dealId, phase: 'post_close', name: 'Lease-up & marketing plan', status: 'todo', sort_order: 1 },
    { deal_id: dealId, phase: 'post_close', name: 'Compliance reporting setup', status: 'todo', sort_order: 2 },
  ]);

  // 5. Milestones
  await admin.from('milestones').insert([
    { deal_id: dealId, name: 'LOI signed', status: 'done', target_date: '2026-01-15', completed_date: '2026-01-12', sort_order: 0 },
    { deal_id: dealId, name: 'Capital stack committed', status: 'active', target_date: '2026-05-15', sort_order: 1 },
    { deal_id: dealId, name: 'Construction loan close', status: 'todo', target_date: '2026-06-30', sort_order: 2 },
    { deal_id: dealId, name: 'Construction start', status: 'todo', target_date: '2026-07-15', sort_order: 3 },
    { deal_id: dealId, name: 'Certificate of occupancy', status: 'todo', target_date: '2027-04-30', sort_order: 4 },
    { deal_id: dealId, name: 'Stabilization (95% leased)', status: 'todo', target_date: '2027-10-31', sort_order: 5 },
  ]);

  // 6. Stakeholders
  await admin.from('deal_stakeholders').insert([
    { deal_id: dealId, name: 'Sarah Chen', role: 'Senior Investment Officer · Apex Impact Fund', status: 'active', action_items: 0 },
    { deal_id: dealId, name: 'Marcus Williams', role: 'Loan Officer · Bridgeview CDFI', status: 'active', action_items: 1 },
    { deal_id: dealId, name: 'Jen Park', role: 'NMTC Equity Manager · Greenway Capital', status: 'active', action_items: 0 },
    { deal_id: dealId, name: 'David Torres', role: 'TIF Coordinator · City of Detroit', status: 'active', action_items: 0 },
    { deal_id: dealId, name: 'Karen Liu', role: 'Construction Lender Counsel', status: 'pending', action_items: 0 },
  ]);

  // 7. Activity log (most recent first via timestamp)
  const now = Date.now();
  await admin.from('activity_log').insert([
    {
      deal_id: dealId,
      actor: 'Real Wisdom',
      action: 'Flagged Bridgeview CDFI doc gap — blocks construction close in 3 days. Identified Form 8821 + draft operating agreement as the missing pieces.',
      type: 'real_wisdom',
      created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      deal_id: dealId,
      actor: 'Sarah Chen · Apex Impact Fund',
      action: 'Confirmed +$400K commitment increase on senior loan',
      type: 'stakeholder',
      created_at: new Date(now - 1000 * 60 * 60 * 14).toISOString(),
    },
    {
      deal_id: dealId,
      actor: 'Real Wisdom',
      action: 'Identified $400K of unclaimed capacity on the Apex loan — recommended drawing down before close to reduce blended COC by 40 bps',
      type: 'real_wisdom',
      created_at: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      deal_id: dealId,
      actor: 'System',
      action: 'City of Detroit Council approved PILOT + TIF allocation',
      type: 'system',
      created_at: new Date(now - 1000 * 60 * 60 * 24 * 11).toISOString(),
    },
    {
      deal_id: dealId,
      actor: 'Belief Capital',
      action: 'Apex Impact Fund committed senior debt 8 weeks before any peer institution would underwrite the deal — survived a stalled period that would have killed the project',
      type: 'belief_capital',
      created_at: new Date(now - 1000 * 60 * 60 * 24 * 90).toISOString(),
    },
  ]);

  // 8. Belief capital moment record
  await admin.from('belief_capital_moments').insert([
    {
      deal_id: dealId,
      developer_org_id: orgId,
      description: 'Apex Impact Fund committed senior debt 8 weeks before any peer institution would underwrite the deal',
      moment_type: 'survival_intervention',
      downstream_value: 7200000,
    },
  ]);

  return NextResponse.json({ ok: true, dealId });
}
