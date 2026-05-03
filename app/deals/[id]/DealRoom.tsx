'use client';

import { useMemo, useState } from 'react';
import type {
  Deal,
  CapitalSource,
  ChecklistItem,
  Milestone,
  Stakeholder,
  ActivityEntry,
  WisdomTrigger,
  DealContext,
} from '@/lib/types';
import DealHeader from '@/components/deal-room/DealHeader';
import CapitalStackTable from '@/components/deal-room/CapitalStackTable';
import ComplianceChecklist from '@/components/deal-room/ComplianceChecklist';
import MilestoneTimeline from '@/components/deal-room/MilestoneTimeline';
import StakeholderPanel from '@/components/deal-room/StakeholderPanel';
import ActivityFeed from '@/components/deal-room/ActivityFeed';
import RealWisdomPanel from '@/components/real-wisdom/RealWisdomPanel';

export default function DealRoom({
  deal,
  capitalSources,
  checklist,
  milestones,
  stakeholders,
  activity,
  userEmail,
}: {
  deal: Deal;
  capitalSources: CapitalSource[];
  checklist: ChecklistItem[];
  milestones: Milestone[];
  stakeholders: Stakeholder[];
  activity: ActivityEntry[];
  userEmail: string;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [trigger, setTrigger] = useState<WisdomTrigger>({ kind: 'free' });
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  // Total secured capital — anything not in 'gap' status counts toward secured
  const secured = useMemo(
    () =>
      capitalSources
        .filter((s) => s.status !== 'gap')
        .reduce((sum, s) => sum + (s.committed_amount ?? 0), 0),
    [capitalSources]
  );

  const dealContext: DealContext = useMemo(
    () => ({
      deal,
      capital_sources: capitalSources,
      checklist,
      milestones,
      recent_activity: activity.slice(0, 10),
    }),
    [deal, capitalSources, checklist, milestones, activity]
  );

  function openWisdomFor(t: WisdomTrigger) {
    setTrigger(t);
    setPanelOpen(true);
  }

  function handleSelectCapital(source: CapitalSource) {
    setSelectedSourceId(source.id);
    openWisdomFor({ kind: 'capital_source', source });
  }

  function openProactive() {
    // Find the most pressing issue — blocked checklist or pending capital with notes
    const blocking = checklist.find((c) => c.blocking_close && c.status !== 'done');
    const pendingWithNote = capitalSources.find((s) => s.status !== 'approved' && s.status !== 'confirmed' && s.notes);
    if (blocking) {
      openWisdomFor({ kind: 'checklist', item: blocking });
      return;
    }
    if (pendingWithNote) {
      setSelectedSourceId(pendingWithNote.id);
      openWisdomFor({ kind: 'capital_source', source: pendingWithNote });
      return;
    }
    openWisdomFor({
      kind: 'auto',
      prompt: `Scan this entire deal and tell me the single most important thing I should be focused on right now. Be specific to this deal — don't give generic advice.`,
    });
  }

  return (
    <div className="min-h-screen bg-teal-deep text-offwhite">
      <DealHeader deal={deal} secured={secured} userEmail={userEmail} />

      {/* Proactive Wisdom banner */}
      <ProactiveWisdomBanner
        deal={deal}
        capitalSources={capitalSources}
        checklist={checklist}
        onClick={openProactive}
      />

      <main className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        <CapitalStackTable
          sources={capitalSources}
          selectedId={selectedSourceId}
          onSelect={handleSelectCapital}
          dealId={deal.id}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ComplianceChecklist
            items={checklist}
            onSelect={(item) => openWisdomFor({ kind: 'checklist', item })}
            dealId={deal.id}
          />
          <MilestoneTimeline
            milestones={milestones}
            onSelect={(m) => openWisdomFor({ kind: 'milestone', milestone: m })}
            dealId={deal.id}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StakeholderPanel stakeholders={stakeholders} dealId={deal.id} />
          <ActivityFeed entries={activity} dealId={deal.id} />
        </div>
      </main>

      {/* Floating Real Wisdom button (always available) */}
      <button
        onClick={() => openWisdomFor({ kind: 'free' })}
        className="fixed bottom-6 right-6 z-30 bg-purple hover:bg-purple-dark text-offwhite px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium"
      >
        <span className="w-2 h-2 rounded-full bg-purple-light animate-pulse" />
        Ask Real Wisdom
      </button>

      <RealWisdomPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        trigger={trigger}
        dealContext={dealContext}
      />
    </div>
  );
}

function ProactiveWisdomBanner({
  deal,
  capitalSources,
  checklist,
  onClick,
}: {
  deal: Deal;
  capitalSources: CapitalSource[];
  checklist: ChecklistItem[];
  onClick: () => void;
}) {
  // Surface the most pressing concern as a one-line headline
  const blocking = checklist.find((c) => c.blocking_close && c.status !== 'done');
  const pendingWithNote = capitalSources.find(
    (s) => s.status !== 'approved' && s.status !== 'confirmed' && s.notes
  );

  let headline = '';
  if (blocking) {
    headline = `${blocking.name} is blocking construction close.${blocking.notes ? ` ${blocking.notes}` : ''}`;
  } else if (pendingWithNote) {
    headline = `${pendingWithNote.name}: ${pendingWithNote.notes}`;
  } else {
    headline = `All systems clear. Ask Real Wisdom anything about ${deal.name}.`;
  }

  return (
    <div
      onClick={onClick}
      className="border-y border-purple/30 bg-purple/5 px-8 py-3 cursor-pointer hover:bg-purple/10 transition flex items-start gap-3"
    >
      <span className="mt-0.5 text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-purple/20 text-purple-light border border-purple/30 shrink-0">
        Real Wisdom
      </span>
      <p className="flex-1 text-sm text-offwhite/90 leading-snug">{headline}</p>
      <span className="text-xs text-purple-light/70 shrink-0 mt-1">Tap to ask →</span>
    </div>
  );
}
