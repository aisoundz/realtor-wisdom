// Deal templates — preload typical capital stack, compliance checklist, and
// milestones for common real estate deal archetypes. Saves a developer 30+ min
// of repetitive setup. Numbers are placeholders sized as % of total cost so the
// stack scales to whatever total the user enters.

export type CapitalTemplate = {
  name: string;
  source_type:
    | 'impact_loan'
    | 'cdfi'
    | 'tif'
    | 'nmtc'
    | 'grant'
    | 'equity'
    | 'ti_prepaid'
    | 'pri'
    | 'developer_equity'
    | 'other';
  pct: number; // fraction of total deal cost
  status: 'requested' | 'pending' | 'in_loi' | 'gap';
  notes?: string;
};

export type ChecklistTemplate = {
  phase: 'pre_development' | 'capital_stack' | 'construction_close' | 'post_close';
  name: string;
  blocking_close?: boolean;
};

export type MilestoneTemplate = {
  name: string;
  // Days from "now" — for target_date calculation
  daysOut: number;
};

export type DealTemplate = {
  id: string;
  label: string;
  description: string;
  defaultDealType: string;
  defaultAmiTargeting: string;
  capital: CapitalTemplate[];
  checklist: ChecklistTemplate[];
  milestones: MilestoneTemplate[];
};

export const DEAL_TEMPLATES: DealTemplate[] = [
  {
    id: 'mixed_use_affordable',
    label: 'Mixed-use affordable (60% AMI)',
    description:
      'Typical structure for ground-floor commercial + affordable units at 60% AMI. Senior CDFI debt + NMTC equity + TIF + HUD HOME gap.',
    defaultDealType: 'mixed_use_affordable',
    defaultAmiTargeting: '60% AMI',
    capital: [
      { name: 'Senior CDFI loan', source_type: 'cdfi', pct: 0.55, status: 'requested', notes: 'Construction-to-perm. Targeting 4.75% rate, 30-year amort.' },
      { name: 'NMTC equity', source_type: 'nmtc', pct: 0.20, status: 'requested', notes: 'CDE allocation pending — 7-year compliance period' },
      { name: 'Local TIF', source_type: 'tif', pct: 0.10, status: 'requested', notes: 'Application drafted — needs city council approval' },
      { name: 'HUD HOME funds', source_type: 'grant', pct: 0.10, status: 'requested', notes: 'State HFA application needed' },
      { name: 'Developer equity', source_type: 'developer_equity', pct: 0.05, status: 'pending' },
    ],
    checklist: [
      { phase: 'pre_development', name: 'Site control secured' },
      { phase: 'pre_development', name: 'Environmental Phase I' },
      { phase: 'pre_development', name: 'Zoning verified' },
      { phase: 'pre_development', name: 'Architectural drawings (75% CDs)' },
      { phase: 'pre_development', name: 'Civil plans submitted' },
      { phase: 'capital_stack', name: 'Senior CDFI commitment letter' },
      { phase: 'capital_stack', name: 'NMTC allocation letter' },
      { phase: 'capital_stack', name: 'TIF approval from city council' },
      { phase: 'capital_stack', name: 'HUD HOME state HFA approval' },
      { phase: 'capital_stack', name: 'Construction contingency funded' },
      { phase: 'construction_close', name: 'Title insurance commitment', blocking_close: true },
      { phase: 'construction_close', name: 'Construction contract execution', blocking_close: true },
      { phase: 'construction_close', name: 'Building permits issued', blocking_close: true },
      { phase: 'construction_close', name: 'Borrower certifications signed' },
      { phase: 'post_close', name: 'Construction draw schedule' },
      { phase: 'post_close', name: 'Lease-up & marketing plan' },
      { phase: 'post_close', name: '60% AMI compliance reporting setup' },
    ],
    milestones: [
      { name: 'LOI signed', daysOut: 30 },
      { name: 'Capital stack committed', daysOut: 120 },
      { name: 'Construction loan close', daysOut: 180 },
      { name: 'Construction start', daysOut: 195 },
      { name: 'Certificate of occupancy', daysOut: 540 },
      { name: 'Stabilization (95% leased)', daysOut: 720 },
    ],
  },
  {
    id: 'multifamily_affordable',
    label: 'Multifamily affordable (LIHTC)',
    description:
      'LIHTC 4% or 9% deal with state HFA tax credits, conventional senior debt, and soft sub debt.',
    defaultDealType: 'multifamily_affordable',
    defaultAmiTargeting: '60% AMI',
    capital: [
      { name: 'Senior conventional loan', source_type: 'impact_loan', pct: 0.50, status: 'requested', notes: 'FHA 221(d)(4) or Fannie/Freddie' },
      { name: 'LIHTC equity', source_type: 'nmtc', pct: 0.30, status: 'requested', notes: '4% credits — non-competitive allocation' },
      { name: 'Soft sub debt (state)', source_type: 'cdfi', pct: 0.10, status: 'requested', notes: 'State HFA gap funding program' },
      { name: 'Local soft funds', source_type: 'grant', pct: 0.07, status: 'requested', notes: 'City/county affordable housing trust fund' },
      { name: 'Developer equity', source_type: 'developer_equity', pct: 0.03, status: 'pending' },
    ],
    checklist: [
      { phase: 'pre_development', name: 'Site control secured' },
      { phase: 'pre_development', name: 'Phase I environmental' },
      { phase: 'pre_development', name: 'Architectural CDs' },
      { phase: 'pre_development', name: 'LIHTC application submitted' },
      { phase: 'capital_stack', name: 'LIHTC reservation letter' },
      { phase: 'capital_stack', name: 'Senior debt commitment' },
      { phase: 'capital_stack', name: 'State HFA soft debt commitment' },
      { phase: 'capital_stack', name: 'Equity investor selected' },
      { phase: 'capital_stack', name: 'Sources & uses balanced' },
      { phase: 'construction_close', name: 'Title commitment', blocking_close: true },
      { phase: 'construction_close', name: 'Construction contract' },
      { phase: 'construction_close', name: 'Building permits' },
      { phase: 'post_close', name: 'Construction draws scheduled' },
      { phase: 'post_close', name: 'Lease-up plan with PHA coordination' },
      { phase: 'post_close', name: 'LIHTC compliance reporting' },
    ],
    milestones: [
      { name: 'LIHTC application submitted', daysOut: 60 },
      { name: 'LIHTC reservation', daysOut: 180 },
      { name: 'Construction close', daysOut: 270 },
      { name: 'Construction start', daysOut: 285 },
      { name: 'Placed in service', daysOut: 720 },
      { name: 'Stabilization', daysOut: 900 },
    ],
  },
  {
    id: 'historic_reuse',
    label: 'Historic adaptive reuse',
    description:
      'Federal + State Historic Tax Credits + NMTC + senior bank debt. Common for downtown anchor projects.',
    defaultDealType: 'historic_reuse',
    defaultAmiTargeting: 'Mixed AMI',
    capital: [
      { name: 'Senior bank loan', source_type: 'impact_loan', pct: 0.55, status: 'requested', notes: 'Construction-to-perm with mini-perm structure' },
      { name: 'Federal HTC equity', source_type: 'nmtc', pct: 0.18, status: 'requested', notes: '20% federal historic tax credit' },
      { name: 'State HTC equity', source_type: 'nmtc', pct: 0.10, status: 'requested', notes: 'Varies by state — typically 20-25%' },
      { name: 'NMTC equity', source_type: 'nmtc', pct: 0.10, status: 'requested', notes: 'Census tract eligibility verified' },
      { name: 'Developer equity', source_type: 'developer_equity', pct: 0.07, status: 'pending' },
    ],
    checklist: [
      { phase: 'pre_development', name: 'Part 1 historic certification submitted' },
      { phase: 'pre_development', name: 'Part 2 construction plans approved by SHPO' },
      { phase: 'pre_development', name: 'Phase I environmental + lead/asbestos survey' },
      { phase: 'pre_development', name: 'Census tract NMTC eligibility verified' },
      { phase: 'capital_stack', name: 'Federal HTC syndicator selected' },
      { phase: 'capital_stack', name: 'State HTC commitment' },
      { phase: 'capital_stack', name: 'NMTC CDE allocation' },
      { phase: 'capital_stack', name: 'Senior debt term sheet' },
      { phase: 'construction_close', name: 'Title insurance', blocking_close: true },
      { phase: 'construction_close', name: 'Construction contract executed' },
      { phase: 'construction_close', name: 'Building permits' },
      { phase: 'post_close', name: 'Part 3 final SHPO certification post-construction' },
      { phase: 'post_close', name: 'NMTC 7-year compliance setup' },
    ],
    milestones: [
      { name: 'Part 1 SHPO submitted', daysOut: 30 },
      { name: 'Part 2 SHPO approved', daysOut: 120 },
      { name: 'Capital stack committed', daysOut: 180 },
      { name: 'Construction close', daysOut: 240 },
      { name: 'Construction start', daysOut: 255 },
      { name: 'Certificate of occupancy + Part 3 filing', daysOut: 720 },
    ],
  },
];

export function getTemplateById(id: string): DealTemplate | undefined {
  return DEAL_TEMPLATES.find((t) => t.id === id);
}
