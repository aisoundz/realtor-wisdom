import type { ActivityEntry } from '@/lib/types';

const TYPE_STYLES: Record<string, { color: string; label: string }> = {
  real_wisdom: { color: 'border-purple bg-purple/10 text-purple', label: 'Real Wisdom' },
  stakeholder: { color: 'border-blue bg-blue/10 text-blue', label: 'Stakeholder' },
  system: { color: 'border-midgray bg-charcoal/40 text-midgray', label: 'System' },
  belief_capital: { color: 'border-amber bg-amber/10 text-amber', label: 'Belief capital' },
};

function timeAgo(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const month = Math.floor(day / 30);
  return `${month}mo ago`;
}

export default function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-teal-mid/20">
        <h2 className="font-serif text-xl">Activity</h2>
        <p className="text-midgray text-xs">Most recent first</p>
      </div>
      <ul className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
        {entries.map((e) => {
          const t = e.type ? TYPE_STYLES[e.type] ?? TYPE_STYLES.system : TYPE_STYLES.system;
          return (
            <li key={e.id} className="flex gap-3">
              <div
                className={`mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${t.color}`}
              >
                {t.label}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm leading-snug">{e.action}</div>
                <div className="text-xs text-midgray mt-1">
                  {e.actor} · {timeAgo(e.created_at)}
                </div>
              </div>
            </li>
          );
        })}
        {entries.length === 0 && (
          <li className="text-sm text-midgray">No activity yet.</li>
        )}
      </ul>
    </section>
  );
}
