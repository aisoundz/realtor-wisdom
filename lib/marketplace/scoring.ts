// Match-score calculator: 0-100 score for how well a marketplace source fits a deal.

export type MarketplaceSource = {
  id: string;
  name: string;
  source_type: string | null;
  description: string | null;
  min_amount: number | null;
  max_amount: number | null;
  target_regions: string[] | null;
  ami_requirements: string[] | null;
  deal_types: string[] | null;
  is_active: boolean;
};

export type ScoringDeal = {
  id: string;
  name: string;
  state: string | null;
  city: string | null;
  ami_targeting: string | null;
  deal_type: string | null;
  total_cost: number | null;
};

export type MatchScore = {
  source: MarketplaceSource;
  score: number;
  reasons: string[];
};

export function scoreSource(source: MarketplaceSource, deal: ScoringDeal): MatchScore {
  let score = 50;
  const reasons: string[] = [];

  // Region match
  const regions = source.target_regions ?? [];
  if (regions.includes('national')) {
    score += 10;
    reasons.push('National coverage');
  } else if (deal.state && regions.includes(deal.state)) {
    score += 20;
    reasons.push(`Active in ${deal.state}`);
  } else if (deal.city && regions.includes(deal.city)) {
    score += 25;
    reasons.push(`Local to ${deal.city}`);
  }

  // AMI match
  const amis = source.ami_requirements ?? [];
  if (deal.ami_targeting && amis.includes(deal.ami_targeting)) {
    score += 15;
    reasons.push(`Funds ${deal.ami_targeting}`);
  }

  // Deal type match
  const types = source.deal_types ?? [];
  if (deal.deal_type && types.includes(deal.deal_type)) {
    score += 15;
    reasons.push('Deal type fit');
  }

  // Amount range match
  if (deal.total_cost && source.min_amount && source.max_amount) {
    const dealAmount = deal.total_cost;
    if (dealAmount >= source.min_amount && dealAmount <= source.max_amount) {
      score += 10;
      reasons.push('Amount in range');
    } else if (dealAmount > source.max_amount) {
      score -= 10;
      reasons.push(`Capped at $${(source.max_amount / 1_000_000).toFixed(0)}M`);
    } else if (dealAmount < source.min_amount) {
      score -= 5;
      reasons.push(`Min $${(source.min_amount / 1_000_000).toFixed(1)}M`);
    }
  }

  return {
    source,
    score: Math.max(0, Math.min(100, score)),
    reasons,
  };
}

export function scoreSourcesForDeal(
  sources: MarketplaceSource[],
  deal: ScoringDeal
): MatchScore[] {
  return sources
    .filter((s) => s.is_active)
    .map((s) => scoreSource(s, deal))
    .sort((a, b) => b.score - a.score);
}
