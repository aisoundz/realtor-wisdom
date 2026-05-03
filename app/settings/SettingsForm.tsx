'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SettingsForm({
  userId,
  initialName,
  initialRole,
  orgId,
  initialOrgName,
  initialOrgType,
}: {
  userId: string;
  initialName: string;
  initialRole: string;
  orgId: string | null;
  initialOrgName: string;
  initialOrgType: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState(initialRole);
  const [orgName, setOrgName] = useState(initialOrgName);
  const [orgType, setOrgType] = useState(initialOrgType || 'developer');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const { error: profErr } = await supabase
      .from('profiles')
      .update({ name: name.trim() || null, role: role.trim() || null })
      .eq('id', userId);

    if (profErr) {
      setError(profErr.message);
      setLoading(false);
      return;
    }

    if (orgId) {
      const { error: orgErr } = await supabase
        .from('organizations')
        .update({ name: orgName.trim() || 'My Organization', type: orgType })
        .eq('id', orgId);
      if (orgErr) {
        setError(orgErr.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-6">
        <h2 className="font-serif text-2xl mb-4">Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anis Taylor"
              className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Founder · Developer"
              className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
            />
          </div>
        </div>
      </section>

      {orgId && (
        <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl p-6">
          <h2 className="font-serif text-2xl mb-4">Organization</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Org name</label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Type</label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
              >
                <option value="developer">Developer</option>
                <option value="fund">Fund</option>
                <option value="cdfi">CDFI</option>
                <option value="lender">Lender</option>
                <option value="agency">Agency</option>
                <option value="accelerator">Accelerator</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="bg-red/10 border border-red/30 text-red px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal hover:bg-teal-mid text-offwhite px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-teal text-sm">✓ Saved</span>}
      </div>
    </form>
  );
}
