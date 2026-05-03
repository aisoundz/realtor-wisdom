'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCollapse } from '@/lib/hooks/useCollapse';
import type { ActivityEntry } from '@/lib/types';
import SectionToggle from './SectionToggle';

const TYPE_STYLES: Record<string, { color: string; label: string }> = {
  real_wisdom: { color: 'border-purple bg-purple/10 text-purple', label: 'Real Wisdom' },
  stakeholder: { color: 'border-blue bg-blue/10 text-blue', label: 'Stakeholder' },
  system: { color: 'border-midgray bg-charcoal/40 text-midgray', label: 'System' },
  belief_capital: { color: 'border-amber bg-amber/10 text-amber', label: 'Belief capital' },
};

const PAGE_SIZE = 20;

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

export default function ActivityFeed({
  entries: initial,
  dealId,
}: {
  entries: ActivityEntry[];
  dealId?: string;
}) {
  const supabase = createClient();
  const [entries, setEntries] = useState<ActivityEntry[]>(initial);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length >= PAGE_SIZE);
  const [collapsed, toggleCollapse] = useCollapse(`activity-${dealId ?? 'global'}`, false);
  const latestEntry = entries[0];

  async function loadMore() {
    if (!dealId || loading) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .range(entries.length, entries.length + PAGE_SIZE - 1);
    if (error) {
      setLoading(false);
      return;
    }
    if (!data || data.length < PAGE_SIZE) setHasMore(false);
    if (data && data.length > 0) {
      setEntries((curr) => [...curr, ...data]);
    }
    setLoading(false);
  }

  return (
    <section className="bg-charcoal/30 border border-teal-mid/20 rounded-2xl overflow-hidden">
      <div className={`px-6 py-4 ${collapsed ? '' : 'border-b border-teal-mid/20'}`}>
        <button
          onClick={toggleCollapse}
          className="flex items-center gap-3 text-left w-full hover:text-teal-light transition"
        >
          <SectionToggle collapsed={collapsed} />
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-xl">Activity</h2>
            <p className="text-midgray text-xs truncate">
              {collapsed && latestEntry
                ? `Latest: ${latestEntry.action.slice(0, 80)}${latestEntry.action.length > 80 ? '…' : ''}`
                : `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} · most recent first`}
            </p>
          </div>
        </button>
      </div>
      {!collapsed && (
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
      )}
      {!collapsed && hasMore && dealId && (
        <div className="border-t border-teal-mid/15 p-3 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="text-sm text-teal hover:text-teal-light font-medium disabled:opacity-50"
          >
            {loading ? 'Loading…' : `Load more activity →`}
          </button>
        </div>
      )}
    </section>
  );
}
