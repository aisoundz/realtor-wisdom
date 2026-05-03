import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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
    .select('id, name, address, city, state, total_cost, status, health_score, real_impact_score')
    .order('updated_at', { ascending: false })
    .limit(10);

  return (
    <main className="min-h-screen bg-teal-deep text-offwhite">
      <header className="border-b border-teal-mid/30 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl">Realtor Wisdom</h1>
          <p className="text-midgray text-sm">Welcome back, {user.email}</p>
        </div>
        <nav className="flex gap-6 text-sm">
          <Link href="/deals" className="hover:text-teal">Deals</Link>
          <Link href="/marketplace" className="hover:text-teal">Marketplace</Link>
          <Link href="/portfolio" className="hover:text-teal">Portfolio</Link>
          <Link href="/real-wisdom" className="hover:text-purple">Real Wisdom</Link>
          <Link href="/impact-score" className="hover:text-amber">RIS</Link>
        </nav>
      </header>

      <section className="px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-3xl">Active deals</h2>
          <Link
            href="/deals/new"
            className="bg-teal hover:bg-teal-mid text-offwhite px-5 py-2.5 rounded-lg text-sm font-medium"
          >
            + New deal
          </Link>
        </div>

        {!deals || deals.length === 0 ? (
          <div className="border border-dashed border-teal-mid/40 rounded-xl p-12 text-center">
            <p className="text-midgray mb-4">No deals yet. Start your first one.</p>
            <Link
              href="/deals/new"
              className="bg-teal hover:bg-teal-mid text-offwhite px-5 py-2.5 rounded-lg inline-block"
            >
              Create your first deal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="block bg-charcoal/40 hover:bg-charcoal/60 border border-teal-mid/30 rounded-xl p-5 transition"
              >
                <h3 className="font-serif text-xl mb-1">{deal.name}</h3>
                <p className="text-midgray text-sm mb-4">
                  {[deal.address, deal.city, deal.state].filter(Boolean).join(', ')}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-teal">RIS {deal.real_impact_score ?? 0}</span>
                  <span className="text-amber">Health {deal.health_score ?? 0}</span>
                  <span className="text-midgray">{deal.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
