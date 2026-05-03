import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import MarketplaceClient from './MarketplaceClient';
import SeedMarketplaceButton from './SeedMarketplaceButton';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [{ data: sources }, { data: deals }] = await Promise.all([
    supabase.from('marketplace_sources').select('*').eq('is_active', true).order('name'),
    supabase
      .from('deals')
      .select('id, name, state, city, ami_targeting, deal_type, total_cost')
      .order('updated_at', { ascending: false }),
  ]);

  return (
    <main className="min-h-screen bg-teal-deep text-offwhite">
      <header className="border-b border-teal-mid/30 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="text-midgray hover:text-teal">← Dashboard</Link>
        </div>
        <h1 className="font-serif text-xl">Capital Marketplace</h1>
        <div className="flex items-center gap-6">
          <nav className="flex gap-6 text-sm">
            <Link href="/dashboard" className="text-midgray hover:text-teal">Deals</Link>
            <Link href="/marketplace" className="text-teal">Marketplace</Link>
            <Link href="/portfolio" className="text-midgray hover:text-teal">Portfolio</Link>
            <Link href="/real-wisdom" className="text-midgray hover:text-purple">Real Wisdom</Link>
            <Link href="/impact-score" className="text-midgray hover:text-amber">RIS</Link>
          </nav>
          <UserMenu email={user.email!} />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-10 space-y-6">
        <div>
          <h2 className="font-serif text-3xl mb-2">Capital sources, ranked by fit</h2>
          <p className="text-midgray text-sm max-w-2xl">
            Your deal profile is the application. Real Wisdom matches each source to your specific
            stack — region, AMI targeting, deal type, amount range — and ranks by composite fit
            score.
          </p>
        </div>

        {!sources || sources.length === 0 ? (
          <div className="border border-dashed border-teal-mid/40 rounded-2xl p-16 text-center bg-charcoal/20">
            <h3 className="font-serif text-2xl mb-3">Marketplace catalog is empty</h3>
            <p className="text-midgray mb-6 max-w-md mx-auto">
              Seed 12 real-estate capital sources — CDFIs, NMTC funds, HUD programs, TIF, and
              impact loans — and start matching them to your deals.
            </p>
            <SeedMarketplaceButton />
          </div>
        ) : !deals || deals.length === 0 ? (
          <div className="border border-dashed border-teal-mid/40 rounded-2xl p-16 text-center bg-charcoal/20">
            <h3 className="font-serif text-2xl mb-3">Create a deal first</h3>
            <p className="text-midgray mb-6">
              Match scoring works against a specific deal&apos;s region, AMI, type, and amount.
              Load the demo or create a new deal to see fit scores.
            </p>
            <Link
              href="/dashboard"
              className="bg-teal hover:bg-teal-mid text-offwhite px-5 py-2.5 rounded-lg inline-block"
            >
              Go to dashboard →
            </Link>
          </div>
        ) : (
          <MarketplaceClient sources={sources} deals={deals} />
        )}
      </div>
    </main>
  );
}
