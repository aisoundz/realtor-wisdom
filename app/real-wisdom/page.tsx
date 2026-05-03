import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import RealWisdomFreeChat from './RealWisdomFreeChat';

export const dynamic = 'force-dynamic';

export default async function RealWisdomPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: deals } = await supabase
    .from('deals')
    .select('id, name, status, real_impact_score, total_cost, address, city, state, ami_targeting, deal_type, health_score, unit_count, is_public, org_id, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(20);

  return (
    <main className="min-h-screen bg-teal-deep text-offwhite">
      <header className="border-b border-teal-mid/30 px-4 sm:px-8 py-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="text-midgray hover:text-teal">← Dashboard</Link>
        </div>
        <h1 className="font-serif text-xl text-purple-light">Real Wisdom</h1>
        <div className="flex items-center gap-4 sm:gap-6 ml-auto">
          <nav className="hidden md:flex gap-6 text-sm">
            <Link href="/dashboard" className="text-midgray hover:text-teal">Deals</Link>
            <Link href="/marketplace" className="text-midgray hover:text-teal">Marketplace</Link>
            <Link href="/portfolio" className="text-midgray hover:text-teal">Portfolio</Link>
            <Link href="/real-wisdom" className="text-purple">Real Wisdom</Link>
            <Link href="/impact-score" className="text-midgray hover:text-amber">RIS</Link>
          </nav>
          <UserMenu email={user.email!} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="mb-6">
          <h2 className="font-serif text-3xl mb-2">Ask anything</h2>
          <p className="text-midgray text-sm max-w-2xl">
            Real Wisdom has full context on your portfolio. Ask about specific deals, capital
            structures, regulatory programs, or strategic decisions. Every response is grounded in
            your real data.
          </p>
        </div>
        <RealWisdomFreeChat deals={deals ?? []} />
      </div>
    </main>
  );
}
