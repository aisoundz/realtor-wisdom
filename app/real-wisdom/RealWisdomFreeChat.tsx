'use client';

import { useState } from 'react';
import RealWisdomPanel from '@/components/real-wisdom/RealWisdomPanel';
import type { Deal, DealContext, WisdomTrigger } from '@/lib/types';

const SUGGESTED_PROMPTS = [
  'What deals in my portfolio have the highest risk this week?',
  'Which capital sources should I be cultivating relationships with for my next deal?',
  'Walk me through the differences between NMTC equity and TIF for a mixed-use deal',
  'How should I structure a deal package to maximize CDFI interest?',
];

export default function RealWisdomFreeChat({ deals }: { deals: Deal[] }) {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<WisdomTrigger>({ kind: 'free' });

  // Build a portfolio context from all the user's deals
  const portfolioContext = {
    deal_count: deals.length,
    deals: deals.map((d) => ({
      name: d.name,
      city: d.city,
      state: d.state,
      total_cost: d.total_cost,
      ami_targeting: d.ami_targeting,
      status: d.status,
      real_impact_score: d.real_impact_score,
      health_score: d.health_score,
      unit_count: d.unit_count,
    })),
  };

  // Render with the existing RealWisdomPanel using the first deal as dealContext
  // (or a synthetic portfolio-only context). Free-mode prompts will go through.
  const dealContext: DealContext = {
    deal: deals[0] ?? ({} as Deal),
    capital_sources: [],
    checklist: [],
    milestones: [],
    recent_activity: [],
  };

  function startWith(prompt: string) {
    setTrigger({ kind: 'auto', prompt });
    setOpen(true);
  }

  return (
    <>
      <div className="bg-charcoal/30 border border-purple/20 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-purple animate-pulse" />
          <span className="text-sm font-medium text-purple-light">Ready when you are</span>
        </div>
        <p className="text-sm text-offwhite/80 leading-relaxed mb-6">
          {deals.length > 0
            ? `I have visibility on ${deals.length} ${deals.length === 1 ? 'deal' : 'deals'} in your portfolio. Ask me anything about your capital, your stakeholders, your compliance gaps, or what to do next.`
            : "I don't see any deals yet — you can still ask me anything about real estate capital, programs, or strategy. Once you load a deal, I'll have full context."}
        </p>
        <button
          onClick={() => {
            setTrigger({ kind: 'free' });
            setOpen(true);
          }}
          className="bg-purple hover:bg-purple-dark text-offwhite px-5 py-2.5 rounded-lg text-sm font-medium"
        >
          Open chat →
        </button>
      </div>

      <h3 className="font-serif text-lg mb-3 text-midgray">Or start with a question</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => startWith(p)}
            className="text-left bg-charcoal/30 hover:bg-charcoal/60 border border-purple/20 hover:border-purple/40 rounded-xl p-4 text-sm leading-snug transition"
          >
            {p}
          </button>
        ))}
      </div>

      <RealWisdomPanel
        open={open}
        onClose={() => setOpen(false)}
        trigger={trigger}
        dealContext={dealContext}
      />
    </>
  );
}
