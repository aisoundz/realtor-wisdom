import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import NewDealForm from './NewDealForm';

export const dynamic = 'force-dynamic';

export default async function NewDealPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  return (
    <main className="min-h-screen bg-teal-deep text-offwhite">
      <header className="border-b border-teal-mid/30 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="text-midgray hover:text-teal">← Dashboard</Link>
        </div>
        <h1 className="font-serif text-xl">New deal</h1>
        <UserMenu email={user.email!} />
      </header>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <h2 className="font-serif text-3xl mb-2">Start a new deal</h2>
        <p className="text-midgray text-sm mb-8">
          Real Wisdom will start working on this deal as soon as you save. The more detail you
          give now, the sharper the insights.
        </p>
        <NewDealForm />
      </div>
    </main>
  );
}
