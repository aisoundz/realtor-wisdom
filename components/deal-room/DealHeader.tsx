import Link from 'next/link';
import type { Deal } from '@/lib/types';

function formatMoney(amount: number | null): string {
  if (amount == null) return '—';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export default function DealHeader({ deal, secured }: { deal: Deal; secured: number }) {
  const gap = (deal.total_cost ?? 0) - secured;
  const completion = deal.total_cost ? Math.min(100, (secured / deal.total_cost) * 100) : 0;

  return (
    <header className="border-b border-teal-mid/30 bg-teal-deep">
      <div className="px-8 py-4 flex items-center justify-between border-b border-teal-mid/20">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="text-midgray hover:text-teal">← Deals</Link>
          <span className="text-midgray">/</span>
          <span className="font-medium">{deal.name}</span>
          <span className="ml-2 text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal/15 text-teal border border-teal/30">
            {deal.status}
          </span>
        </div>
        <nav className="flex gap-6 text-sm">
          <Link href="/dashboard" className="text-midgray hover:text-teal">Deals</Link>
          <Link href="/marketplace" className="text-midgray hover:text-teal">Marketplace</Link>
          <Link href="/portfolio" className="text-midgray hover:text-teal">Portfolio</Link>
          <Link href="/real-wisdom" className="text-midgray hover:text-purple">Real Wisdom</Link>
          <Link href="/impact-score" className="text-midgray hover:text-amber">RIS</Link>
        </nav>
      </div>

      <div className="px-8 py-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-serif text-4xl mb-1">{deal.name}</h1>
            <p className="text-midgray text-sm">
              {[deal.address, deal.city, deal.state].filter(Boolean).join(', ')}
              {deal.unit_count ? ` · ${deal.unit_count} units` : ''}
              {deal.ami_targeting ? ` · ${deal.ami_targeting}` : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Capital goal" value={formatMoney(deal.total_cost)} accent="teal" />
          <Metric label="Secured" value={formatMoney(secured)} accent="teal" />
          <Metric
            label="Gap"
            value={gap > 0 ? formatMoney(gap) : 'Fully funded'}
            accent={gap > 0 ? 'red' : 'teal'}
          />
          <Metric label="Real Impact Score" value={String(deal.real_impact_score ?? 0)} accent="amber" />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-midgray mb-1.5">
            <span>Stack completion</span>
            <span>{completion.toFixed(0)}% of {formatMoney(deal.total_cost)}</span>
          </div>
          <div className="h-2 rounded-full bg-charcoal/60 overflow-hidden flex">
            <div className="h-full bg-teal" style={{ width: `${completion}%` }} />
            {gap > 0 && <div className="h-full bg-amber/70" style={{ width: `${100 - completion}%` }} />}
          </div>
        </div>
      </div>
    </header>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: 'teal' | 'amber' | 'red' }) {
  const colorMap = {
    teal: 'text-teal',
    amber: 'text-amber',
    red: 'text-red',
  };
  return (
    <div className="bg-charcoal/40 border border-teal-mid/20 rounded-xl px-5 py-4">
      <div className="text-xs uppercase tracking-wider text-midgray mb-1.5">{label}</div>
      <div className={`font-serif text-2xl ${colorMap[accent]}`}>{value}</div>
    </div>
  );
}
