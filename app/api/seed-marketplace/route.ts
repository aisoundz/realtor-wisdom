import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Seeds the global marketplace_sources catalog with 12 realistic real-estate
// capital sources. Idempotent — if already seeded, returns ok without
// duplicating.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { count, error: countErr } = await supabase
    .from('marketplace_sources')
    .select('id', { count: 'exact', head: true });

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json({ ok: true, alreadySeeded: true, count });
  }

  const sources = [
    {
      name: 'National Equity Fund',
      source_type: 'nmtc',
      description:
        'NMTC equity for community development. Particular strength in mixed-use affordable and historic adaptive reuse.',
      min_amount: 1_000_000,
      max_amount: 10_000_000,
      target_regions: ['national'],
      ami_requirements: ['80% AMI', '60% AMI', '50% AMI'],
      deal_types: ['mixed_use_affordable', 'multifamily_affordable', 'historic_reuse'],
      is_active: true,
    },
    {
      name: 'LISC New Markets Fund',
      source_type: 'nmtc',
      description: 'NMTC allocations focused on community impact deals in qualified census tracts.',
      min_amount: 500_000,
      max_amount: 5_000_000,
      target_regions: ['national'],
      ami_requirements: ['80% AMI', '60% AMI'],
      deal_types: ['mixed_use_affordable', 'multifamily_affordable', 'community_facility'],
      is_active: true,
    },
    {
      name: 'Reinvestment Fund',
      source_type: 'cdfi',
      description:
        'Senior, sub debt, and predevelopment lending. Strong in mid-Atlantic and gateway cities.',
      min_amount: 250_000,
      max_amount: 15_000_000,
      target_regions: ['Mid-Atlantic', 'Northeast', 'national'],
      ami_requirements: ['80% AMI', '60% AMI'],
      deal_types: ['multifamily_affordable', 'mixed_use_affordable', 'community_facility', 'commercial'],
      is_active: true,
    },
    {
      name: 'Self-Help Federal Credit Union',
      source_type: 'cdfi',
      description: 'CDFI lending across the spectrum, including construction and mini-perm financing.',
      min_amount: 100_000,
      max_amount: 10_000_000,
      target_regions: ['national'],
      ami_requirements: ['80% AMI', '60% AMI'],
      deal_types: ['multifamily_affordable', 'mixed_use_affordable', 'small_business'],
      is_active: true,
    },
    {
      name: 'Detroit Development Fund',
      source_type: 'cdfi',
      description:
        'Detroit-focused CDFI. Patient capital for projects too complex for traditional banks.',
      min_amount: 100_000,
      max_amount: 2_000_000,
      target_regions: ['MI', 'Detroit'],
      ami_requirements: ['80% AMI', '60% AMI'],
      deal_types: ['mixed_use_affordable', 'small_business', 'community_facility'],
      is_active: true,
    },
    {
      name: 'MSHDA HOME Funds',
      source_type: 'grant',
      description:
        'Michigan State Housing Development Authority HOME Investment Partnership program. Up to $3M per project.',
      min_amount: 50_000,
      max_amount: 3_000_000,
      target_regions: ['MI'],
      ami_requirements: ['80% AMI', '60% AMI', '50% AMI'],
      deal_types: ['multifamily_affordable', 'mixed_use_affordable'],
      is_active: true,
    },
    {
      name: 'HUD 221(d)(4)',
      source_type: 'impact_loan',
      description:
        'FHA-insured construction-to-permanent loan for new construction or substantial rehab of multifamily.',
      min_amount: 5_000_000,
      max_amount: 100_000_000,
      target_regions: ['national'],
      ami_requirements: ['80% AMI', '60% AMI', 'market'],
      deal_types: ['multifamily_affordable', 'mixed_use_affordable', 'multifamily_market'],
      is_active: true,
    },
    {
      name: 'Capital Impact Partners',
      source_type: 'impact_loan',
      description:
        'CDFI offering pre-development, acquisition, and construction loans for impact-driven deals.',
      min_amount: 500_000,
      max_amount: 25_000_000,
      target_regions: ['national'],
      ami_requirements: ['80% AMI', '60% AMI'],
      deal_types: ['mixed_use_affordable', 'multifamily_affordable', 'community_facility', 'health_center'],
      is_active: true,
    },
    {
      name: 'Calvert Impact Capital',
      source_type: 'impact_loan',
      description:
        'Impact lending across affordable housing, community facilities, and small business.',
      min_amount: 500_000,
      max_amount: 15_000_000,
      target_regions: ['national'],
      ami_requirements: ['80% AMI', '60% AMI'],
      deal_types: ['mixed_use_affordable', 'multifamily_affordable', 'small_business'],
      is_active: true,
    },
    {
      name: 'City of Detroit TIF',
      source_type: 'tif',
      description:
        'Detroit Brownfield Redevelopment Authority and DEGC TIF financing for qualifying projects.',
      min_amount: 100_000,
      max_amount: 5_000_000,
      target_regions: ['MI', 'Detroit'],
      ami_requirements: ['80% AMI', '60% AMI', 'market'],
      deal_types: ['mixed_use_affordable', 'historic_reuse', 'commercial'],
      is_active: true,
    },
    {
      name: 'Enterprise Community Loan Fund',
      source_type: 'cdfi',
      description: 'CDFI lending for affordable housing preservation and new construction.',
      min_amount: 250_000,
      max_amount: 15_000_000,
      target_regions: ['national'],
      ami_requirements: ['80% AMI', '60% AMI', '50% AMI', '30% AMI'],
      deal_types: ['multifamily_affordable', 'mixed_use_affordable', 'preservation'],
      is_active: true,
    },
    {
      name: 'NeighborWorks Capital',
      source_type: 'impact_loan',
      description:
        'Specialized lending to NeighborWorks network organizations for affordable housing.',
      min_amount: 1_000_000,
      max_amount: 20_000_000,
      target_regions: ['national'],
      ami_requirements: ['80% AMI', '60% AMI', '50% AMI'],
      deal_types: ['multifamily_affordable', 'mixed_use_affordable'],
      is_active: true,
    },
  ];

  const { error: insertErr } = await supabase.from('marketplace_sources').insert(sources);
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, seeded: sources.length });
}
