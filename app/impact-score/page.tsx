import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import RISRing from '@/components/impact-score/RISRing';
import DimensionBars from '@/components/impact-score/DimensionBars';
import { calculateRIS, type RISDimensions } from '@/lib/ris/calculate';

export const dynamic = 'force-dynamic';

const MOMENT_TYPE_STYLES: Record<string, string> = {
  belief_support: 'bg-amber/15 text-amber border-amber/30',
  connection: 'bg-blue/15 text-blue border-blue/30',
  survival_intervention: 'bg-red/15 text-red border-red/30',
  network_activation: 'bg-purple/15 text-purple border-purple/30',
  mentorship: 'bg-teal/15 text-teal border-teal/30',
};

function formatMoney(amount: number | null): string {
  if (amount == null) return '—';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export default async function ImpactScorePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Fetch ALL deal data so we can compute live RIS per-deal and aggregate
  const [
    { data: deals },
    { data: capitalSources },
    { data: checklist },
    { data: milestones },
    { data: stakeholders },
    { data: moments },
  ] = await Promise.all([
    supabase.from('deals').select('*'),
    supabase.from('capital_sources').select('*'),
    supabase.from('checklist_items').select('*'),
    supabase.from('milestones').select('*'),
    supabase.from('deal_stakeholders').select('*'),
    supabase.from('belief_capital_moments').select('*').order('occurred_at', { ascending: false }),
  ]);

  const dealList = deals ?? [];
  const allCapital = capitalSources ?? [];
  const allChecklist = checklist ?? [];
  const allMilestones = milestones ?? [];
  const allStakeholders = stakeholders ?? [];
  const allMoments = moments ?? [];

  // Compute RIS per deal, then aggregate
  const perDealRIS = dealList.map((d) =>
    calculateRIS({
      deal: d,
      capitalSources: allCapital.filter((s) => s.deal_id === d.id),
      checklist: allChecklist.filter((c) => c.deal_id === d.id),
      milestones: allMilestones.filter((m) => m.deal_id === d.id),
      stakeholders: allStakeholders.filter((s) => s.deal_id === d.id),
      beliefMoments: allMoments.filter((m) => m.deal_id === d.id),
    })
  );

  const compositeScore =
    perDealRIS.length > 0
      ? Math.round(perDealRIS.reduce((sum, r) => sum + r.composite, 0) / perDealRIS.length)
      : 0;

  // Aggregate dimensions across deals (average each)
  const dimensionKeys: (keyof RISDimensions)[] = [
    'community_outcomes',
    'financial_performance',
    'growth_trajectory',
    'network_depth',
    'belief_capital',
    'survival_interventions',
    'network_activations',
  ];
  const aggregatedDimensions: RISDimensions = {} as RISDimensions;
  for (const k of dimensionKeys) {
    aggregatedDimensions[k] =
      perDealRIS.length > 0
        ? Math.round(perDealRIS.reduce((sum, r) => sum + r.dimensions[k], 0) / perDealRIS.length)
        : 0;
  }

  // Headline counts
  const totalUnits = dealList.reduce((sum, d) => sum + (d.unit_count ?? 0), 0);
  const totalCapitalDeployed = dealList.reduce((sum, d) => sum + (d.total_cost ?? 0), 0);
  const totalDownstreamValue = allMoments.reduce(
    (sum, m) => sum + Number(m.downstream_value ?? 0),
    0
  );

  const dimensions = [
    {
      key: 'community_outcomes',
      label: 'Community outcomes',
      value: aggregatedDimensions.community_outcomes,
      description: `${totalUnits} units · ${dealList.filter((d) => d.ami_targeting).length} AMI-targeted`,
    },
    {
      key: 'financial_performance',
      label: 'Financial performance',
      value: aggregatedDimensions.financial_performance,
      description: 'Stack completion, source diversification',
    },
    {
      key: 'growth_trajectory',
      label: 'Growth trajectory',
      value: aggregatedDimensions.growth_trajectory,
      description: `Milestone progress across ${dealList.length} deal${dealList.length === 1 ? '' : 's'}`,
    },
    {
      key: 'network_depth',
      label: 'Network depth',
      value: aggregatedDimensions.network_depth,
      description: 'Active stakeholders + approved capital partners',
    },
    {
      key: 'belief_capital',
      label: 'Belief capital received',
      value: aggregatedDimensions.belief_capital,
      description: `${allMoments.length} moment${allMoments.length === 1 ? '' : 's'} logged`,
    },
    {
      key: 'survival_interventions',
      label: 'Survival interventions',
      value: aggregatedDimensions.survival_interventions,
      description: `${allMoments.filter((m) => m.moment_type === 'survival_intervention').length} interventions tracked`,
    },
    {
      key: 'network_activations',
      label: 'Network activations',
      value: aggregatedDimensions.network_activations,
      description: `${allMoments.filter((m) => m.moment_type === 'network_activation' || m.moment_type === 'connection').length} activations`,
    },
  ];

  return (
    <main className="min-h-screen bg-teal-deep text-offwhite">
      <header className="border-b border-teal-mid/30 px-4 sm:px-8 py-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="text-midgray hover:text-teal">← Dashboard</Link>
        </div>
        <h1 className="font-serif text-xl">Real Impact Score™</h1>
        <div className="flex items-center gap-4 sm:gap-6 ml-auto">
          <nav className="hidden md:flex gap-6 text-sm">
            <Link href="/dashboard" className="text-midgray hover:text-teal">Deals</Link>
            <Link href="/marketplace" className="text-midgray hover:text-teal">Marketplace</Link>
            <Link href="/portfolio" className="text-midgray hover:text-teal">Portfolio</Link>
            <Link href="/real-wisdom" className="text-midgray hover:text-purple">Real Wisdom</Link>
            <Link href="/impact-score" className="text-amber">RIS</Link>
          </nav>
          <UserMenu email={user.email!} />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">
        {/* Hero */}
        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-8 items-center">
            <RISRing score={compositeScore} />
            <div>
              <h2 className="font-serif text-3xl mb-2">
                Your impact, measured beyond the deal
              </h2>
              <p className="text-midgray text-sm mb-6 max-w-2xl">
                The Real Impact Score™ tracks the full causal chain from belief capital moment to
                community outcome. Recalculated from your actual data — every checklist item you
                close, every capital source you secure, every belief capital moment you log shifts
                this score in real time.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
                <Stat label="Active deals" value={String(dealList.length)} />
                <Stat label="Units" value={String(totalUnits)} />
                <Stat label="Capital deployed" value={formatMoney(totalCapitalDeployed)} />
                <Stat label="Downstream value" value={formatMoney(totalDownstreamValue)} />
              </div>
            </div>
          </div>
        </section>

        {/* Dimensions */}
        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-6">
          <h3 className="font-serif text-2xl mb-1">Score dimensions</h3>
          <p className="text-midgray text-sm mb-6">
            Each is computed from real signals on your deals. Move a milestone to done, mark a
            checklist item complete, log a moment — watch these shift.
          </p>
          <DimensionBars dimensions={dimensions} />
        </section>

        {/* Per-deal breakdown */}
        {dealList.length > 0 && (
          <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-teal-mid/20">
              <h3 className="font-serif text-2xl">Per-deal scores</h3>
              <p className="text-midgray text-sm">Live computed — click a deal to see what&apos;s driving the number.</p>
            </div>
            <ul className="divide-y divide-teal-mid/15">
              {dealList.map((d, i) => {
                const ris = perDealRIS[i];
                return (
                  <li key={d.id} className="px-6 py-3 hover:bg-charcoal/40 transition">
                    <Link href={`/deals/${d.id}`} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-medium">{d.name}</div>
                        <div className="text-xs text-midgray">
                          {ris.signals.completion}% stack · {ris.signals.milestonesDone}/
                          {ris.signals.milestonesTotal} milestones · {ris.signals.moments} moments
                          {ris.signals.blockingClose > 0 && (
                            <span className="text-red"> · {ris.signals.blockingClose} blocking</span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`font-serif text-2xl ${
                          ris.composite >= 80 ? 'text-teal' : ris.composite >= 60 ? 'text-amber' : 'text-red'
                        }`}
                      >
                        {ris.composite}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Belief capital moments */}
        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-teal-mid/20">
            <h3 className="font-serif text-2xl">Belief capital moments</h3>
            <p className="text-midgray text-sm">
              Every interaction that creates downstream value, logged. Most platforms can&apos;t see
              these. Yours does.
            </p>
          </div>
          {allMoments.length === 0 ? (
            <div className="p-12 text-center text-midgray text-sm">
              No moments logged yet. Click ✨ in any Real Wisdom conversation to capture one.
            </div>
          ) : (
            <ul className="divide-y divide-teal-mid/15">
              {allMoments.map((m) => {
                const style = m.moment_type
                  ? MOMENT_TYPE_STYLES[m.moment_type] ?? MOMENT_TYPE_STYLES.belief_support
                  : MOMENT_TYPE_STYLES.belief_support;
                return (
                  <li key={m.id} className="px-6 py-4 flex items-start gap-4">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${style}`}>
                      {(m.moment_type ?? 'moment').replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm leading-snug">{m.description}</p>
                      <p className="text-xs text-midgray mt-1">
                        {new Date(m.occurred_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {m.downstream_value != null
                          ? ` · downstream value ${formatMoney(Number(m.downstream_value))}`
                          : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-midgray mb-1">{label}</div>
      <div className="font-serif text-2xl">{value}</div>
    </div>
  );
}
