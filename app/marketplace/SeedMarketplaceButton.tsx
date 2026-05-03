'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SeedMarketplaceButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/seed-marketplace', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Failed to seed marketplace');
        setLoading(false);
        return;
      }
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
        className="bg-teal hover:bg-teal-mid text-offwhite px-6 py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? 'Seeding…' : '⚡ Seed marketplace catalog'}
      </button>
      {error && <p className="text-red text-sm">{error}</p>}
    </div>
  );
}
