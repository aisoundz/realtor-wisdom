import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import RISRing from '@/components/impact-score/RISRing';
import DimensionBars from '@/components/impact-score/DimensionBars';

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

  // Fetch user's deals + their belief capital moments
  const [{ data: deals }, { data: moments }] = await Promise.all([
    supabase.from('deals').select('id, name, real_impact_score, total_cost, unit_count, ami_targeting'),
    supabase.from('belief_capital_moments').select('*').order('occurred_at', { ascending: false }),
  ]);

  const dealList = deals ?? [];
  const momentList = moments ?? [];

  // Compute composite RIS as average of deal RIS scores
  const compositeScore =
    dealList.length > 0
      ? Math.round(
          dealList.reduce((sum, d) => sum + (d.real_impact_score ?? 0), 0) / dealList.length
        )
      : 0;

  // Compute totals
  const totalUnits = dealList.reduce((sum, d) => sum + (d.unit_count ?? 0), 0);
  const totalCapitalDeployed = dealList.reduce((sum, d) => sum + (d.total_cost ?? 0), 0);
  const totalDownstreamValue = momentList.reduce(
    (sum, m) => sum + Number(m.downstream_value ?? 0),
    0
  );
  const survivalInterventions = momentList.filter((m) => m.moment_type === 'survival_intervention').length;
  const networkActivations = momentList.filter((m) => m.moment_type === 'network_activation').length;

  // Synthesize dimension scores. Real RIS would compute from underlying signals;
  // here we derive plausible values from what's in the database.
  const dimensions = [
    {
      key: 'community_outcomes',
      label: 'Community outcomes',
      value: Math.min(100, totalUnits * 1.5 + 30),
      description: `${totalUnits} units · ${dealList.filter((d) => d.ami_targeting).length} AMI-targeted deals`,
    },
    {
      key: 'financial_performance',
      label: 'Financial performance',
      value: 72,
      description: 'Stack completion, draw discipline, IRR projections',
    },
    {
      key: 'growth_trajectory',
      label: 'Growth trajectory',
      value: 65,
      description: `${dealList.length} active deal${dealList.length === 1 ? '' : 's'} · pipeline velocity`,
    },
    {
      key: 'network_depth',
      label: 'Network depth',
      value: 78,
      description: 'Stakeholder relationships, repeat capital partners',
    },
    {
      key: 'belief_capital',
      label: 'Belief capital received',
      value: Math.min(100, momentList.length * 20 + 40),
      description: `${momentList.length} moment${momentList.length === 1 ? '' : 's'} logged`,
    },
    {
      key: 'survival_interventions',
      label: 'Survival interventions',
      value: Math.min(100, survivalInterventions * 30 + 50),
      description: `${survivalInterventions} interventions tracked`,
    },
    {
      key: 'network_activations',
      label: 'Network activations',
      value: Math.min(100, networkActivations * 25 + 45),
      description: `${networkActivations} activations · introductions made`,
    },
  ];

  return (
    <main className="min-h-screen bg-teal-deep text-offwhite">
      <header className="border-b border-teal-mid/30 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="text-midgray hover:text-teal">← Dashboard</Link>
        </div>
        <h1 className="font-serif text-xl">Real Impact Score™</h1>
        <div className="flex items-center gap-6">
          <nav className="flex gap-6 text-sm">
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
        {/* Hero — Score + headline metrics */}
        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-8 items-center">
            <RISRing score={compositeScore} />
            <div>
              <h2 className="font-serif text-3xl mb-2">
                Your impact, measured beyond the deal
              </h2>
              <p className="text-midgray text-sm mb-6 max-w-2xl">
                The Real Impact Score™ tracks the full causal chain from belief capital moment to
                community outcome. Not just dollars and units — the introductions, interventions,
                and network activations that compound over time.
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
            Seven signals that compound into your composite score. Belief-capital dimensions are
            unique to Realtor Wisdom — measuring what most platforms ignore.
          </p>
          <DimensionBars dimensions={dimensions} />
        </section>

        {/* Belief capital moments */}
        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-teal-mid/20">
            <h3 className="font-serif text-2xl">Belief capital moments</h3>
            <p className="text-midgray text-sm">
              Every interaction that creates downstream value, logged. Most platforms can't see
              these. Yours does.
            </p>
          </div>
          {momentList.length === 0 ? (
            <div className="p-12 text-center text-midgray text-sm">
              No moments logged yet. Real Wisdom will surface these as your deals progress.
            </div>
          ) : (
            <ul className="divide-y divide-teal-mid/15">
              {momentList.map((m) => {
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
