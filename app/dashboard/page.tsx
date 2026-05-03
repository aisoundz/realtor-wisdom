import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SeedButton from './SeedButton';
import UserMenu from '@/components/UserMenu';
import DealCardMenu from '@/components/DealCardMenu';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: deals } = await supabase
    .from('deals')
    .select('id, name, address, city, state, total_cost, status, health_score, real_impact_score, is_public')
    .order('updated_at', { ascending: false })
    .limit(10);

  return (
    <main className="min-h-screen bg-teal-deep text-offwhite">
      <header className="border-b border-teal-mid/30 px-4 sm:px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl">
            Realtor <span className="text-teal">Wisdom</span>
          </h1>
          <p className="text-midgray text-sm truncate">Welcome back, {user.email}</p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 ml-auto">
          <nav className="hidden md:flex gap-6 text-sm">
            <Link href="/dashboard" className="text-teal">Deals</Link>
            <Link href="/marketplace" className="hover:text-teal">Marketplace</Link>
            <Link href="/portfolio" className="hover:text-teal">Portfolio</Link>
            <Link href="/real-wisdom" className="hover:text-purple">Real Wisdom</Link>
            <Link href="/impact-score" className="hover:text-amber">RIS</Link>
          </nav>
          <UserMenu email={user.email!} />
        </div>
      </header>

      <section className="px-8 py-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-3xl">Active deals</h2>
          {deals && deals.length > 0 && (
            <Link
              href="/deals/new"
              className="bg-teal hover:bg-teal-mid text-offwhite px-5 py-2.5 rounded-lg text-sm font-medium"
            >
              + New deal
            </Link>
          )}
        </div>

        {!deals || deals.length === 0 ? (
          <div className="border border-dashed border-teal-mid/40 rounded-2xl p-16 text-center bg-charcoal/20">
            <h3 className="font-serif text-2xl mb-3">No deals yet — start with a demo</h3>
            <p className="text-midgray mb-6 max-w-md mx-auto">
              See the entire platform working in 5 seconds. Real capital stack, real compliance gaps, real Wisdom insights.
            </p>
            <SeedButton />
            <p className="text-midgray text-xs mt-6">
              Or{' '}
              <Link href="/deals/new" className="text-teal hover:underline">
                create your own deal from scratch →
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className="relative bg-charcoal/40 hover:bg-charcoal/60 border border-teal-mid/30 rounded-xl transition group"
              >
                <Link
                  href={`/deals/${deal.id}`}
                  className="block p-5 pr-14"
                >
                  <h3 className="font-serif text-xl mb-1">{deal.name}</h3>
                  <p className="text-midgray text-sm mb-4">
                    {[deal.address, deal.city, deal.state].filter(Boolean).join(', ')}
                    {deal.is_public && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber/15 text-amber border border-amber/30">
                        public
                      </span>
                    )}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-midgray">RIS</div>
                      <div className="text-teal font-medium text-base">{deal.real_impact_score ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-midgray">Health</div>
                      <div className="text-amber font-medium text-base">{deal.health_score ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-midgray">Status</div>
                      <div className="font-medium text-base capitalize">{deal.status}</div>
                    </div>
                  </div>
                </Link>
                <div className="absolute top-3 right-3">
                  <DealCardMenu dealId={deal.id} dealName={deal.name} isPublic={deal.is_public} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
