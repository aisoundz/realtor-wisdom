import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role, org_id')
    .eq('id', user.id)
    .single();

  const { data: org } = profile?.org_id
    ? await supabase.from('organizations').select('id, name, type').eq('id', profile.org_id).single()
    : { data: null };

  return (
    <main className="min-h-screen bg-teal-deep text-offwhite">
      <header className="border-b border-teal-mid/30 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-midgray hover:text-teal text-sm">← Dashboard</Link>
        </div>
        <h1 className="font-serif text-xl">Settings</h1>
        <div className="w-24" />
      </header>

      <div className="max-w-3xl mx-auto px-8 py-10 space-y-8">
        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-6">
          <h2 className="font-serif text-2xl mb-4">Account</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 text-sm">
            <dt className="text-midgray">Email</dt>
            <dd className="sm:col-span-2">{user.email}</dd>
            <dt className="text-midgray">Name</dt>
            <dd className="sm:col-span-2">{profile?.name || '—'}</dd>
            <dt className="text-midgray">Role</dt>
            <dd className="sm:col-span-2">{profile?.role || 'Developer'}</dd>
            <dt className="text-midgray">User ID</dt>
            <dd className="sm:col-span-2 font-mono text-xs text-midgray break-all">{user.id}</dd>
          </dl>
        </section>

        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-6">
          <h2 className="font-serif text-2xl mb-4">Organization</h2>
          {org ? (
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 text-sm">
              <dt className="text-midgray">Name</dt>
              <dd className="sm:col-span-2">{org.name}</dd>
              <dt className="text-midgray">Type</dt>
              <dd className="sm:col-span-2 capitalize">{org.type}</dd>
              <dt className="text-midgray">Org ID</dt>
              <dd className="sm:col-span-2 font-mono text-xs text-midgray break-all">{org.id}</dd>
            </dl>
          ) : (
            <p className="text-midgray text-sm">
              No organization yet. Load a deal from the dashboard to create one automatically.
            </p>
          )}
        </section>

        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-6">
          <h2 className="font-serif text-2xl mb-2">Coming soon</h2>
          <p className="text-midgray text-sm">
            Organization branding, team invites, notification preferences, API access, and Real Wisdom voice settings.
          </p>
        </section>
      </div>
    </main>
  );
}
