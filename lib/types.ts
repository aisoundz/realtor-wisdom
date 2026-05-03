// Shared types used across deal-room components.

export type Deal = {
  id: string;
  org_id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  unit_count: number | null;
  ami_targeting: string | null;
  deal_type: string | null;
  total_cost: number | null;
  status: string;
  health_score: number | null;
  real_impact_score: number | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type CapitalSource = {
  id: string;
  deal_id: string;
  name: string;
  source_type: string | null;
  committed_amount: number | null;
  status: string;
  notes: string | null;
  sort_order: number;
};

export type ChecklistItem = {
  id: string;
  deal_id: string;
  phase: string | null;
  name: string;
  status: string;
  blocking_close: boolean;
  notes: string | null;
  sort_order: number;
};

export type Milestone = {
  id: string;
  deal_id: string;
  name: string;
  status: string;
  target_date: string | null;
  completed_date: string | null;
  sort_order: number;
};

export type Stakeholder = {
  id: string;
  deal_id: string;
  name: string;
  role: string | null;
  status: string;
  action_items: number;
};

export type ActivityEntry = {
  id: string;
  deal_id: string | null;
  actor: string;
  action: string;
  type: string | null;
  created_at: string;
};

export type DealContext = {
  deal: Deal;
  capital_sources: CapitalSource[];
  checklist: ChecklistItem[];
  milestones: Milestone[];
  recent_activity: ActivityEntry[];
};

// Real Wisdom panel context — what triggered the panel to open
export type WisdomTrigger =
  | { kind: 'auto'; prompt: string }
  | { kind: 'capital_source'; source: CapitalSource }
  | { kind: 'checklist'; item: ChecklistItem }
  | { kind: 'milestone'; milestone: Milestone }
  | { kind: 'free' };
