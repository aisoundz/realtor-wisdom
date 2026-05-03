'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SeedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/seed-demo-deal', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Failed to seed demo deal');
        setLoading(false);
        return;
      }
      router.push(`/deals/${json.dealId}`);
      router.refresh();
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleSeed}
        disabled={loading}
        className="bg-teal hover:bg-teal-mid text-offwhite px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition"
      >
        {loading ? 'Building Southside Commons…' : '⚡ Load demo deal — Southside Commons'}
      </button>
      {error && <p className="text-red text-sm">{error}</p>}
      <p className="text-midgray text-xs max-w-md text-center">
        Creates a fully-populated demo deal — capital stack, compliance checklist, milestones, stakeholders, and activity feed — so you can see the platform in action.
      </p>
    </div>
  );
}
