'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const DEAL_TYPES = [
  { value: 'mixed_use_affordable', label: 'Mixed-use affordable' },
  { value: 'multifamily_affordable', label: 'Multifamily affordable' },
  { value: 'multifamily_market', label: 'Multifamily market-rate' },
  { value: 'historic_reuse', label: 'Historic adaptive reuse' },
  { value: 'preservation', label: 'Preservation / rehab' },
  { value: 'community_facility', label: 'Community facility' },
  { value: 'commercial', label: 'Commercial / retail' },
  { value: 'small_business', label: 'Small business / commercial' },
  { value: 'health_center', label: 'Health center / clinic' },
  { value: 'other', label: 'Other' },
];

const AMI_OPTIONS = ['30% AMI', '50% AMI', '60% AMI', '80% AMI', '120% AMI', 'Mixed AMI', 'Market-rate'];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

export default function NewDealForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [dealType, setDealType] = useState('mixed_use_affordable');
  const [totalCost, setTotalCost] = useState('');
  const [unitCount, setUnitCount] = useState('');
  const [amiTargeting, setAmiTargeting] = useState('60% AMI');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Get user's profile to find org_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Not signed in');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, name')
      .eq('id', user.id)
      .single();

    let orgId = profile?.org_id as string | null;

    // Auto-create org if missing
    if (!orgId) {
      const orgName = profile?.name ? `${profile.name}'s Organization` : 'My Organization';
      const { data: newOrg, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: orgName, type: 'developer' })
        .select('id')
        .single();
      if (orgErr) {
        setError(`Could not create organization: ${orgErr.message}`);
        setLoading(false);
        return;
      }
      orgId = newOrg.id;
      await supabase.from('profiles').update({ org_id: orgId }).eq('id', user.id);
    }

    const totalCostNum = totalCost ? Number(totalCost.replace(/[^0-9]/g, '')) : null;
    const unitCountNum = unitCount ? Number(unitCount) : null;

    if (totalCostNum != null && totalCostNum < 1) {
      setError('Total project cost must be at least $1.');
      setLoading(false);
      return;
    }
    if (unitCountNum != null && unitCountNum < 0) {
      setError('Unit count cannot be negative.');
      setLoading(false);
      return;
    }

    const { data: deal, error: dealErr } = await supabase
      .from('deals')
      .insert({
        org_id: orgId,
        name,
        address: address || null,
        city: city || null,
        state: state || null,
        unit_count: unitCountNum,
        ami_targeting: amiTargeting || null,
        deal_type: dealType,
        total_cost: totalCostNum,
        status: 'active',
        health_score: 50,
        real_impact_score: 50,
        is_public: false,
      })
      .select('id')
      .single();

    if (dealErr) {
      setError(dealErr.message);
      setLoading(false);
      return;
    }

    // Seed the activity feed with the creation event so the deal room isn't empty
    await supabase.from('activity_log').insert({
      deal_id: deal.id,
      org_id: orgId,
      actor: 'You',
      action: `Deal created — ${name}${city || state ? `, ${[city, state].filter(Boolean).join(', ')}` : ''}${totalCostNum ? ` ($${(totalCostNum / 1_000_000).toFixed(1)}M)` : ''}`,
      type: 'system',
    });

    router.push(`/deals/${deal.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Deal name" required>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Southside Commons"
          className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal"
        />
      </Field>

      <Field label="Address">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="1234 South 5th Street"
          className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="City">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Detroit"
            className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal"
          />
        </Field>
        <Field label="State">
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal"
          >
            <option value="">Select…</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Deal type" required>
        <select
          required
          value={dealType}
          onChange={(e) => setDealType(e.target.value)}
          className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal"
        >
          {DEAL_TYPES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Total project cost">
          <input
            type="text"
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            placeholder="$7,200,000"
            className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal"
          />
          <p className="text-xs text-midgray mt-1">Numbers only — formatting cleaned automatically</p>
        </Field>
        <Field label="Unit count">
          <input
            type="number"
            value={unitCount}
            onChange={(e) => setUnitCount(e.target.value)}
            placeholder="48"
            className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal"
          />
        </Field>
      </div>

      <Field label="AMI targeting">
        <select
          value={amiTargeting}
          onChange={(e) => setAmiTargeting(e.target.value)}
          className="w-full bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal"
        >
          {AMI_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Field>

      {error && (
        <div className="bg-red/10 border border-red/30 text-red px-3 py-2.5 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal hover:bg-teal-mid text-offwhite px-6 py-2.5 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create deal'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-midgray hover:text-offwhite px-4 py-2.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-amber ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
