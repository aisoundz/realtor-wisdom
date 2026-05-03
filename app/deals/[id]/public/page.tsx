import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data: deal } = await supabase
    .from('deals')
    .select('name, city, state, total_cost, real_impact_score, ami_targeting, unit_count')
    .eq('id', params.id)
    .eq('is_public', true)
    .single();

  if (!deal) {
    return { title: 'Deal not found · Realtor Wisdom' };
  }

  const location = [deal.city, deal.state].filter(Boolean).join(', ');
  const subtitle = [
    deal.unit_count ? `${deal.unit_count} units` : null,
    deal.ami_targeting,
    deal.total_cost
      ? `$${(deal.total_cost / 1_000_000).toFixed(1)}M deal`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const description = `${deal.name} in ${location}. ${subtitle}. RIS ${deal.real_impact_score ?? 0}. Built on Realtor Wisdom — the real estate capital operating system.`;

  return {
    title: `${deal.name} · Realtor Wisdom`,
    description,
    openGraph: {
      title: `${deal.name} — ${location}`,
      description,
      url: `https://realtorwisdom.io/deals/${params.id}/public`,
      siteName: 'Realtor Wisdom',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${deal.name} — ${location}`,
      description,
    },
  };
}

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-teal/15 text-teal border-teal/30',
  confirmed: 'bg-teal/15 text-teal border-teal/30',
  pending: 'bg-amber/15 text-amber border-amber/30',
  in_loi: 'bg-amber/15 text-amber border-amber/30',
  requested: 'bg-blue/15 text-blue border-blue/30',
  gap: 'bg-red/15 text-red border-red/30',
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

export default async function PublicDealProfile({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: deal }, { data: capitalSources }, { data: milestones }] = await Promise.all([
    supabase.from('deals').select('*').eq('id', params.id).eq('is_public', true).single(),
    supabase.from('capital_sources').select('*').eq('deal_id', params.id).order('sort_order'),
    supabase.from('milestones').select('*').eq('deal_id', params.id).order('sort_order'),
  ]);

  if (!deal) notFound();

  const secured = (capitalSources ?? [])
    .filter((s) => s.status !== 'gap')
    .reduce((sum, s) => sum + (s.committed_amount ?? 0), 0);
  const completion = deal.total_cost ? Math.min(100, (secured / deal.total_cost) * 100) : 0;

  return (
    <main className="min-h-screen bg-teal-deep text-offwhite">
      <header className="border-b border-teal-mid/30 px-8 py-5 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl">
          Realtor <span className="text-teal italic">Wisdom</span>
        </Link>
        <span className="text-xs uppercase tracking-wider text-midgray">Public deal profile</span>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
        {/* Hero */}
        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-8">
          <h1 className="font-serif text-4xl mb-2">{deal.name}</h1>
          <p className="text-midgray mb-6">
            {[deal.address, deal.city, deal.state].filter(Boolean).join(', ')}
            {deal.unit_count ? ` · ${deal.unit_count} units` : ''}
            {deal.ami_targeting ? ` · ${deal.ami_targeting}` : ''}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Stat label="Capital goal" value={formatMoney(deal.total_cost)} />
            <Stat label="Secured" value={formatMoney(secured)} />
            <Stat
              label="Gap"
              value={
                (deal.total_cost ?? 0) - secured > 0
                  ? formatMoney((deal.total_cost ?? 0) - secured)
                  : 'Fully funded'
              }
              accent={(deal.total_cost ?? 0) - secured > 0 ? 'red' : 'teal'}
            />
            <Stat
              label="Real Impact Score"
              value={String(deal.real_impact_score ?? 0)}
              accent="amber"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-midgray mb-1.5">
              <span>Stack completion</span>
              <span>
                {completion.toFixed(0)}% of {formatMoney(deal.total_cost)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-charcoal/60 overflow-hidden">
              <div className="h-full bg-teal" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </section>

        {/* Capital stack */}
        {capitalSources && capitalSources.length > 0 && (
          <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-teal-mid/20">
              <h2 className="font-serif text-2xl">Capital stack</h2>
            </div>
            <ul>
              {capitalSources.map((s) => {
                const style = STATUS_STYLES[s.status] ?? STATUS_STYLES.pending;
                return (
                  <li key={s.id} className="px-6 py-4 border-b last:border-b-0 border-teal-mid/15">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-medium text-base">{s.name}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${style}`}
                          >
                            {s.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-midgray">
                          {s.source_type
                            ? SOURCE_TYPE_LABELS[s.source_type] ?? s.source_type
                            : ''}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-serif text-xl">
                          {formatMoney(s.committed_amount)}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Milestones */}
        {milestones && milestones.length > 0 && (
          <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-6">
            <h2 className="font-serif text-2xl mb-4">Milestones</h2>
            <ol className="space-y-3">
              {milestones.map((m, idx) => (
                <li key={m.id} className="flex items-start gap-4">
                  <span
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium shrink-0 ${
                      m.status === 'done'
                        ? 'bg-teal text-offwhite border-teal'
                        : m.status === 'active'
                          ? 'bg-amber text-charcoal border-amber'
                          : 'bg-charcoal/60 text-midgray border-midgray/40'
                    }`}
                  >
                    {m.status === 'done' ? '✓' : idx + 1}
                  </span>
                  <div className="flex-1 pt-1">
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-xs text-midgray mt-0.5">
                      {m.status === 'done' && m.completed_date
                        ? `Completed ${m.completed_date}`
                        : m.target_date
                          ? `Target ${m.target_date}`
                          : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-teal-mid/20">
          <p className="text-midgray text-sm mb-2">
            This deal profile is shared from{' '}
            <Link href="/" className="text-teal hover:underline">
              Realtor Wisdom
            </Link>{' '}
            — the real estate capital operating system.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block mt-2 text-xs px-4 py-2 rounded-full bg-teal hover:bg-teal-mid text-offwhite font-medium"
          >
            Build your own deal profile →
          </Link>
        </footer>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent = 'teal',
}: {
  label: string;
  value: string;
  accent?: 'teal' | 'amber' | 'red';
}) {
  const colorMap = {
    teal: 'text-teal',
    amber: 'text-amber',
    red: 'text-red',
  };
  return (
    <div className="bg-charcoal/40 border border-teal-mid/20 rounded-xl px-5 py-4">
      <div className="text-xs uppercase tracking-wider text-midgray mb-1.5">{label}</div>
      <div className={`font-serif text-2xl ${colorMap[accent]}`}>{value}</div>
    </div>
  );
}
