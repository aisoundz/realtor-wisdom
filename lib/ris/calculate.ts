// Real Impact Score — pure calculator.
// Takes deal + related entities, returns 7 dimensions and a composite score.
// Used everywhere we display RIS so the number is always live.

import type {
  Deal,
  CapitalSource,
  ChecklistItem,
  Milestone,
  Stakeholder,
} from '@/lib/types';

export type BeliefMoment = {
  id: string;
  moment_type: string | null;
  downstream_value: number | null;
};

export type RISInput = {
  deal: Pick<Deal, 'unit_count' | 'ami_targeting' | 'total_cost' | 'health_score'>;
  capitalSources: CapitalSource[];
  checklist: ChecklistItem[];
  milestones: Milestone[];
  stakeholders: Stakeholder[];
  beliefMoments: BeliefMoment[];
};

export type RISDimensions = {
  community_outcomes: number;
  financial_performance: number;
  growth_trajectory: number;
  network_depth: number;
  belief_capital: number;
  survival_interventions: number;
  network_activations: number;
};

export type RISResult = {
  composite: number;
  dimensions: RISDimensions;
  signals: {
    units: number;
    securedAmount: number;
    totalCost: number;
    completion: number;
    blockingClose: number;
    milestonesDone: number;
    milestonesTotal: number;
    stakeholders: number;
    capitalPartners: number;
    moments: number;
    survivalCount: number;
    activationCount: number;
  };
};

const WEIGHTS_DEVELOPER: Record<keyof RISDimensions, number> = {
  community_outcomes: 0.20,
  financial_performance: 0.15,
  growth_trajectory: 0.15,
  network_depth: 0.15,
  belief_capital: 0.15,
  survival_interventions: 0.10,
  network_activations: 0.10,
};

const WEIGHTS_FUND: Record<keyof RISDimensions, number> = {
  community_outcomes: 0.15,
  financial_performance: 0.10,
  growth_trajectory: 0.10,
  network_depth: 0.20,
  belief_capital: 0.15,
  survival_interventions: 0.15,
  network_activations: 0.15,
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function calculateRIS(input: RISInput, mode: 'developer' | 'fund' = 'developer'): RISResult {
  // 1. Community outcomes — units + AMI targeting + deal type
  const units = input.deal.unit_count ?? 0;
  const ami = input.deal.ami_targeting ?? '';
  const deepAmi = /3[0-5]%|50%|60%/.test(ami);
  const moderateAmi = /80%/.test(ami);
  const amiBonus = deepAmi ? 25 : moderateAmi ? 12 : 0;
  const community_outcomes = clamp(units * 0.8 + amiBonus + 30);

  // 2. Financial performance — stack completion + diversification
  const totalCost = input.deal.total_cost ?? 0;
  const securedAmount = input.capitalSources
    .filter((s) => s.status !== 'gap')
    .reduce((sum, s) => sum + (s.committed_amount ?? 0), 0);
  const completion = totalCost > 0 ? (securedAmount / totalCost) * 100 : 0;
  const sourceCount = input.capitalSources.filter((s) => s.status !== 'gap').length;
  const diversification = Math.min(20, sourceCount * 4); // each source up to 5 = 20pts bonus
  const financial_performance = clamp(completion * 0.8 + diversification);

  // 3. Growth trajectory — milestone progress + has-an-active-milestone bonus
  const milestonesDone = input.milestones.filter((m) => m.status === 'done').length;
  const milestonesTotal = input.milestones.length;
  const milestonesActive = input.milestones.some((m) => m.status === 'active');
  const milestonePct = milestonesTotal > 0 ? (milestonesDone / milestonesTotal) * 100 : 0;
  const growth_trajectory = clamp(
    milestonePct * 0.8 + (milestonesActive ? 20 : 0) + (milestonesTotal > 0 ? 10 : 0)
  );

  // 4. Network depth — active stakeholders + approved capital partners
  const activeStakeholders = input.stakeholders.filter((s) => s.status === 'active').length;
  const capitalPartners = input.capitalSources.filter((s) =>
    ['approved', 'confirmed'].includes(s.status)
  ).length;
  const network_depth = clamp(activeStakeholders * 10 + capitalPartners * 8 + 30);

  // 5. Belief capital — count + total downstream value
  const moments = input.beliefMoments;
  const totalDownstream = moments.reduce(
    (sum, m) => sum + Number(m.downstream_value ?? 0),
    0
  );
  const downstreamBonus = Math.min(30, totalDownstream / 1_000_000); // each $1M = 1pt up to 30
  const belief_capital = clamp(moments.length * 12 + downstreamBonus + 35);

  // 6. Survival interventions
  const survivalCount = moments.filter((m) => m.moment_type === 'survival_intervention').length;
  const survival_interventions = clamp(survivalCount * 25 + 50);

  // 7. Network activations
  const activationCount = moments.filter(
    (m) => m.moment_type === 'network_activation' || m.moment_type === 'connection'
  ).length;
  const network_activations = clamp(activationCount * 20 + 45);

  // Block-close penalty (composite-only, doesn't change individual dimensions)
  const blockingClose = input.checklist.filter(
    (c) => c.blocking_close && c.status !== 'done'
  ).length;
  const blockingPenalty = blockingClose * 5;

  // Composite — weighted average
  const weights = mode === 'fund' ? WEIGHTS_FUND : WEIGHTS_DEVELOPER;
  const dimensions: RISDimensions = {
    community_outcomes,
    financial_performance,
    growth_trajectory,
    network_depth,
    belief_capital,
    survival_interventions,
    network_activations,
  };
  let composite = 0;
  for (const k of Object.keys(weights) as (keyof RISDimensions)[]) {
    composite += dimensions[k] * weights[k];
  }
  composite = clamp(composite - blockingPenalty);

  return {
    composite,
    dimensions,
    signals: {
      units,
      securedAmount,
      totalCost,
      completion: Math.round(completion),
      blockingClose,
      milestonesDone,
      milestonesTotal,
      stakeholders: activeStakeholders,
      capitalPartners,
      moments: moments.length,
      survivalCount,
      activationCount,
    },
  };
}
