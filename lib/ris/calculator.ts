// Real Impact Score (RIS) calculator
// Composite of seven dimensions, weighted. Each dimension is 0-100.

export type RISDimensions = {
  community_outcomes: number;
  financial_performance: number;
  growth_trajectory: number;
  network_depth: number;
  belief_capital: number;
  survival_interventions: number;
  network_activations: number;
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

export function computeComposite(
  dims: RISDimensions,
  entityType: 'developer' | 'fund' | 'community'
): number {
  const weights = entityType === 'fund' ? WEIGHTS_FUND : WEIGHTS_DEVELOPER;
  let total = 0;
  for (const key of Object.keys(weights) as (keyof RISDimensions)[]) {
    total += (dims[key] ?? 0) * weights[key];
  }
  return Math.round(total);
}
