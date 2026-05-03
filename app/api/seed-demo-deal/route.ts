import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// One-click seed: creates the "Southside Commons" deal that mirrors the
// marketing site's Live Demo card — full capital stack, compliance, milestones,
// stakeholders, and activity. Uses the regular auth client (publishable key +
// user session). RLS lets the user create org/deal/etc. for their own account.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Ensure the user has a profile + org
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, org_id, name')
    .eq('id', user.id)
    .single();

  if (profileErr) {
    return NextResponse.json({ error: `profile_lookup: ${profileErr.message}` }, { status: 500 });
  }

  let orgId = profile?.org_id as string | null;
  if (!orgId) {
    const orgName = profile?.name ? `${profile.name}'s Organization` : 'My Organization';
    const { data: newOrg, error: orgErr } = await supabase
      .from('organizations')
      .insert({ name: orgName, type: 'developer' })
      .select('id')
      .single();
    if (orgErr) {
      return NextResponse.json({ error: `org_create: ${orgErr.message}` }, { status: 500 });
    }
    orgId = newOrg.id;
    const { error: profUpdErr } = await supabase
      .from('profiles')
      .update({ org_id: orgId })
      .eq('id', user.id);
    if (profUpdErr) {
      return NextResponse.json({ error: `profile_update: ${profUpdErr.message}` }, { status: 500 });
    }
  }

  // 2. Create the deal
  const { data: deal, error: dealErr } = await supabase
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
  if (dealErr) {
    return NextResponse.json({ error: `deal_create: ${dealErr.message}` }, { status: 500 });
  }

  const dealId = deal.id;

  // 3. Capital stack — matches the marketing demo card
  const { error: capErr } = await supabase.from('capital_sources').insert([
    {
      deal_id: dealId,
      name: 'Apex Impact Fund',
      source_type: 'impact_loan',
      committed_amount: 2100000,
      status: 'approved',
      notes:
        '+$400K available on your approved loan — Real Wisdom recommends drawing down before construction close to lower blended cost of capital',
      sort_order: 0,
    },
    {
      deal_id: dealId,
      name: 'Bridgeview CDFI',
      source_type: 'cdfi',
      committed_amount: 1200000,
      status: 'pending',
      notes:
        'Doc missing — blocking close in 3 days. Form 8821 + draft op agreement needed by Friday',
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
  if (capErr) {
    return NextResponse.json({ error: `capital_sources: ${capErr.message}` }, { status: 500 });
  }

  // 4. Compliance checklist
  const { error: chkErr } = await supabase.from('checklist_items').insert([
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
  if (chkErr) {
    return NextResponse.json({ error: `checklist: ${chkErr.message}` }, { status: 500 });
  }

  // 5. Milestones
  const { error: milErr } = await supabase.from('milestones').insert([
    { deal_id: dealId, name: 'LOI signed', status: 'done', target_date: '2026-01-15', completed_date: '2026-01-12', sort_order: 0 },
    { deal_id: dealId, name: 'Capital stack committed', status: 'active', target_date: '2026-05-15', sort_order: 1 },
    { deal_id: dealId, name: 'Construction loan close', status: 'todo', target_date: '2026-06-30', sort_order: 2 },
    { deal_id: dealId, name: 'Construction start', status: 'todo', target_date: '2026-07-15', sort_order: 3 },
    { deal_id: dealId, name: 'Certificate of occupancy', status: 'todo', target_date: '2027-04-30', sort_order: 4 },
    { deal_id: dealId, name: 'Stabilization (95% leased)', status: 'todo', target_date: '2027-10-31', sort_order: 5 },
  ]);
  if (milErr) {
    return NextResponse.json({ error: `milestones: ${milErr.message}` }, { status: 500 });
  }

  // 6. Stakeholders
  const { error: stkErr } = await supabase.from('deal_stakeholders').insert([
    { deal_id: dealId, name: 'Sarah Chen', role: 'Senior Investment Officer · Apex Impact Fund', status: 'active', action_items: 0 },
    { deal_id: dealId, name: 'Marcus Williams', role: 'Loan Officer · Bridgeview CDFI', status: 'active', action_items: 1 },
    { deal_id: dealId, name: 'Jen Park', role: 'NMTC Equity Manager · Greenway Capital', status: 'active', action_items: 0 },
    { deal_id: dealId, name: 'David Torres', role: 'TIF Coordinator · City of Detroit', status: 'active', action_items: 0 },
    { deal_id: dealId, name: 'Karen Liu', role: 'Construction Lender Counsel', status: 'pending', action_items: 0 },
  ]);
  if (stkErr) {
    return NextResponse.json({ error: `stakeholders: ${stkErr.message}` }, { status: 500 });
  }

  // 7. Activity log
  const now = Date.now();
  const { error: actErr } = await supabase.from('activity_log').insert([
    {
      deal_id: dealId,
      org_id: orgId,
      actor: 'Real Wisdom',
      action:
        'Flagged Bridgeview CDFI doc gap — blocks construction close in 3 days. Identified Form 8821 + draft operating agreement as the missing pieces.',
      type: 'real_wisdom',
      created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      deal_id: dealId,
      org_id: orgId,
      actor: 'Sarah Chen · Apex Impact Fund',
      action: 'Confirmed +$400K commitment increase on senior loan',
      type: 'stakeholder',
      created_at: new Date(now - 1000 * 60 * 60 * 14).toISOString(),
    },
    {
      deal_id: dealId,
      org_id: orgId,
      actor: 'Real Wisdom',
      action:
        'Identified $400K of unclaimed capacity on the Apex loan — recommended drawing down before close to reduce blended COC by 40 bps',
      type: 'real_wisdom',
      created_at: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      deal_id: dealId,
      org_id: orgId,
      actor: 'System',
      action: 'City of Detroit Council approved PILOT + TIF allocation',
      type: 'system',
      created_at: new Date(now - 1000 * 60 * 60 * 24 * 11).toISOString(),
    },
    {
      deal_id: dealId,
      org_id: orgId,
      actor: 'Belief Capital',
      action:
        'Apex Impact Fund committed senior debt 8 weeks before any peer institution would underwrite the deal — survived a stalled period that would have killed the project',
      type: 'belief_capital',
      created_at: new Date(now - 1000 * 60 * 60 * 24 * 90).toISOString(),
    },
  ]);
  if (actErr) {
    return NextResponse.json({ error: `activity: ${actErr.message}` }, { status: 500 });
  }

  // 8. Belief capital moment
  await supabase.from('belief_capital_moments').insert([
    {
      deal_id: dealId,
      developer_org_id: orgId,
      description:
        'Apex Impact Fund committed senior debt 8 weeks before any peer institution would underwrite the deal',
      moment_type: 'survival_intervention',
      downstream_value: 7200000,
    },
  ]);

  return NextResponse.json({ ok: true, dealId });
}
