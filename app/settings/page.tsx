import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import SettingsForm from './SettingsForm';
import DangerZone from './DangerZone';

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
        <UserMenu email={user.email!} />
      </header>

      <div className="max-w-3xl mx-auto px-8 py-10 space-y-8">
        <div>
          <h2 className="font-serif text-3xl mb-2">Your settings</h2>
          <p className="text-midgray text-sm">Update your name, role, and organization details.</p>
        </div>

        <SettingsForm
          userId={user.id}
          initialName={profile?.name ?? ''}
          initialRole={profile?.role ?? ''}
          orgId={profile?.org_id ?? null}
          initialOrgName={org?.name ?? ''}
          initialOrgType={org?.type ?? ''}
        />

        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-6">
          <h2 className="font-serif text-2xl mb-2">Email</h2>
          <p className="text-midgray text-sm mb-4">
            Your account email is <span className="text-offwhite">{user.email}</span>. Email changes
            are handled separately for security — contact support to change it.
          </p>
        </section>

        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-6">
          <h2 className="font-serif text-2xl mb-2">Coming soon</h2>
          <p className="text-midgray text-sm">
            Team invites, notification preferences, API access, and Real Wisdom voice settings.
          </p>
        </section>

        <DangerZone userEmail={user.email!} />
      </div>
    </main>
  );
}
