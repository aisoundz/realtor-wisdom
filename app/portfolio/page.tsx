import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import RISRing from '@/components/impact-score/RISRing';
import { calculateRIS } from '@/lib/ris/calculate';

export const dynamic = 'force-dynamic';

function formatMoney(amount: number | null): string {
  if (amount == null) return '—';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export default async function PortfolioPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Fetch all deal-related data so we can compute live RIS per deal
  const [
    { data: deals },
    { data: sources },
    { data: checklist },
    { data: milestones },
    { data: stakeholders },
    { data: moments },
  ] = await Promise.all([
    supabase.from('deals').select('*').order('updated_at', { ascending: false }),
    supabase.from('capital_sources').select('*'),
    supabase.from('checklist_items').select('*'),
    supabase.from('milestones').select('*'),
    supabase.from('deal_stakeholders').select('*'),
    supabase.from('belief_capital_moments').select('*'),
  ]);

  const dealList = deals ?? [];
  const sourceList = sources ?? [];
  const checklistList = checklist ?? [];
  const milestoneList = milestones ?? [];
  const stakeholderList = stakeholders ?? [];
  const momentList = moments ?? [];

  // Compute live RIS per deal using the calculator
  const perDealRIS = dealList.map((d) =>
    calculateRIS(
      {
        deal: d,
        capitalSources: sourceList.filter((s) => s.deal_id === d.id),
        checklist: checklistList.filter((c) => c.deal_id === d.id),
        milestones: milestoneList.filter((m) => m.deal_id === d.id),
        stakeholders: stakeholderList.filter((s) => s.deal_id === d.id),
        beliefMoments: momentList.filter((m) => m.deal_id === d.id),
      },
      'fund'
    )
  );

  // Aggregate fund-level metrics
  const totalCommitted = dealList.reduce((sum, d) => sum + (d.total_cost ?? 0), 0);
  const totalDeployed = sourceList
    .filter((s) => s.status === 'approved' || s.status === 'confirmed')
    .reduce((sum, s) => sum + (s.committed_amount ?? 0), 0);
  const totalUnits = dealList.reduce((sum, d) => sum + (d.unit_count ?? 0), 0);
  const fundRIS =
    perDealRIS.length > 0
      ? Math.round(perDealRIS.reduce((sum, r) => sum + r.composite, 0) / perDealRIS.length)
      : 0;
  const survivalInterventions = momentList.filter(
    (m) => m.moment_type === 'survival_intervention'
  ).length;

  // Per-deal: capital secured, completion, blocking items, and live RIS
  const dealMetrics = dealList.map((deal, idx) => {
    const dealSources = sourceList.filter((s) => s.deal_id === deal.id);
    const secured = dealSources
      .filter((s) => s.status !== 'gap')
      .reduce((sum, s) => sum + (s.committed_amount ?? 0), 0);
    const total = deal.total_cost ?? 0;
    const completion = total > 0 ? Math.round((secured / total) * 100) : 0;
    const blockingItems = checklistList.filter(
      (c) => c.deal_id === deal.id && c.blocking_close && c.status !== 'done'
    ).length;
    return {
      ...deal,
      secured,
      completion,
      blockingItems,
      liveRIS: perDealRIS[idx].composite,
    };
  });

  // Earliest "warning" signals — deals < 50% complete or with blocking issues
  const earlyWarnings = dealMetrics.filter((d) => d.completion < 50 || d.blockingItems > 0);

  return (
    <main className="min-h-screen bg-teal-deep text-offwhite">
      <header className="border-b border-teal-mid/30 px-4 sm:px-8 py-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="text-midgray hover:text-teal">← Dashboard</Link>
        </div>
        <h1 className="font-serif text-xl">Institution View</h1>
        <div className="flex items-center gap-4 sm:gap-6 ml-auto">
          <nav className="hidden md:flex gap-6 text-sm">
            <Link href="/dashboard" className="text-midgray hover:text-teal">Deals</Link>
            <Link href="/marketplace" className="text-midgray hover:text-teal">Marketplace</Link>
            <Link href="/portfolio" className="text-teal">Portfolio</Link>
            <Link href="/real-wisdom" className="text-midgray hover:text-purple">Real Wisdom</Link>
            <Link href="/impact-score" className="text-midgray hover:text-amber">RIS</Link>
          </nav>
          <UserMenu email={user.email!} />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">
        {/* Fund summary */}
        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-8 items-center">
            <RISRing score={fundRIS} />
            <div>
              <h2 className="font-serif text-3xl mb-2">Fund Real Impact Score</h2>
              <p className="text-midgray text-sm mb-6 max-w-2xl">
                The institution-side composite. Aggregates community outcomes, financial
                performance, and the belief-capital dimensions across every deal in the portfolio
                — including survival interventions and network activations only Realtor Wisdom can
                surface.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Stat label="Active deals" value={String(dealList.length)} />
                <Stat label="Capital committed" value={formatMoney(totalCommitted)} />
                <Stat label="Capital deployed" value={formatMoney(totalDeployed)} />
                <Stat label="Units in portfolio" value={String(totalUnits)} />
              </div>
            </div>
          </div>
        </section>

        {/* Early warning signals */}
        {earlyWarnings.length > 0 && (
          <section className="bg-amber/5 border border-amber/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-amber/20 text-amber border border-amber/30">
                Early warning
              </span>
              <h3 className="font-serif text-lg text-amber-light">
                {earlyWarnings.length} deal{earlyWarnings.length === 1 ? '' : 's'} need attention
              </h3>
            </div>
            <ul className="space-y-2 text-sm">
              {earlyWarnings.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <Link href={`/deals/${d.id}`} className="hover:text-teal">
                    {d.name}
                  </Link>
                  <span className="text-xs text-midgray">
                    {d.completion}% stack complete
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Portfolio table */}
        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-teal-mid/20">
            <h3 className="font-serif text-2xl">Portfolio</h3>
            <p className="text-midgray text-sm">
              Every deal you&apos;re in. RIS, completion, capital secured, and the relationship
              depth that compounds over years.
            </p>
          </div>
          {dealList.length === 0 ? (
            <div className="p-12 text-center text-midgray text-sm">
              No deals in portfolio yet. Load a demo deal from the dashboard to see what an
              institution view looks like with real data.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-midgray border-b border-teal-mid/15">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Deal</th>
                  <th className="text-left px-6 py-3 font-medium">Location</th>
                  <th className="text-right px-6 py-3 font-medium">Total</th>
                  <th className="text-right px-6 py-3 font-medium">Secured</th>
                  <th className="text-right px-6 py-3 font-medium">Completion</th>
                  <th className="text-right px-6 py-3 font-medium">RIS</th>
                  <th className="text-right px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {dealMetrics.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-teal-mid/10 hover:bg-charcoal/40 transition"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/deals/${d.id}`} className="font-medium hover:text-teal">
                        {d.name}
                      </Link>
                      {d.unit_count != null && (
                        <div className="text-xs text-midgray mt-0.5">
                          {d.unit_count} units · {d.ami_targeting ?? 'mixed AMI'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-midgray text-xs">
                      {[d.city, d.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatMoney(d.total_cost)}
                    </td>
                    <td className="px-6 py-4 text-right text-teal">
                      {formatMoney(d.secured)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs">{d.completion}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-charcoal/60 overflow-hidden">
                          <div
                            className={`h-full ${
                              d.completion >= 80
                                ? 'bg-teal'
                                : d.completion >= 50
                                  ? 'bg-amber'
                                  : 'bg-red'
                            }`}
                            style={{ width: `${d.completion}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-serif text-base ${
                          d.liveRIS >= 80
                            ? 'text-teal'
                            : d.liveRIS >= 60
                              ? 'text-amber'
                              : 'text-red'
                        }`}
                      >
                        {d.liveRIS}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs capitalize text-midgray">
                      {d.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Belief capital interventions */}
        {survivalInterventions > 0 && (
          <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-6">
            <h3 className="font-serif text-2xl mb-2">Belief capital footprint</h3>
            <p className="text-midgray text-sm mb-4">
              Where your capital created downstream value beyond the IRR.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Stat label="Survival interventions" value={String(survivalInterventions)} />
              <Stat
                label="Belief capital moments"
                value={String(momentList.length)}
              />
              <Stat
                label="Downstream value"
                value={formatMoney(
                  momentList.reduce((s, m) => s + Number(m.downstream_value ?? 0), 0)
                )}
              />
            </div>
          </section>
        )}
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
