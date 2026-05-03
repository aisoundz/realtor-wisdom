'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AddStakeholderForm({
  dealId,
  onClose,
}: {
  dealId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('active');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('deal_stakeholders').insert({
      deal_id: dealId,
      name,
      role: role || null,
      status,
      action_items: 0,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-charcoal/60 border-t border-teal-mid/30">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
        />
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role · Organization"
          className="sm:col-span-2 bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:col-span-3 bg-charcoal/40 border border-teal-mid/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
        >
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      {error && <p className="text-red text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal hover:bg-teal-mid text-offwhite px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Adding…' : 'Add stakeholder'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-midgray hover:text-offwhite px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
