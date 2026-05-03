-- Realtor Wisdom — Supabase schema
-- Run this in the Supabase SQL editor against a fresh project.
-- Idempotent — safe to re-run.

-- =====================================================
-- Users and organizations
-- =====================================================

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('developer','fund','cdfi','lender','agency','accelerator')),
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  org_id uuid references organizations,
  name text,
  role text,
  avatar_url text,
  created_at timestamptz default now()
);

-- =====================================================
-- Deals
-- =====================================================

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations,
  name text not null,
  address text,
  city text,
  state text,
  unit_count integer,
  ami_targeting text,
  deal_type text,
  total_cost numeric,
  status text default 'active',
  health_score integer default 0,
  real_impact_score integer default 0,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- Capital sources (per deal — the capital stack)
-- =====================================================

create table if not exists capital_sources (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals on delete cascade,
  name text not null,
  source_type text check (source_type in (
    'impact_loan','cdfi','tif','nmtc','grant',
    'equity','ti_prepaid','pri','developer_equity','other'
  )),
  committed_amount numeric default 0,
  status text default 'pending' check (status in (
    'approved','pending','in_loi','requested','gap','confirmed'
  )),
  notes text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- Compliance checklist
-- =====================================================

create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals on delete cascade,
  phase text check (phase in ('pre_development','capital_stack','construction_close','post_close')),
  name text not null,
  status text default 'todo' check (status in ('done','pending','blocked','todo')),
  blocking_close boolean default false,
  notes text,
  completed_at timestamptz,
  sort_order integer default 0
);

-- =====================================================
-- Milestones
-- =====================================================

create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals on delete cascade,
  name text not null,
  status text default 'todo' check (status in ('done','active','todo')),
  target_date date,
  completed_date date,
  sort_order integer default 0
);

-- =====================================================
-- Stakeholders on a deal
-- =====================================================

create table if not exists deal_stakeholders (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals on delete cascade,
  org_id uuid references organizations,
  name text not null,
  role text,
  status text default 'active',
  action_items integer default 0
);

-- =====================================================
-- Activity log (deal feed)
-- =====================================================

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals,
  org_id uuid references organizations,
  actor text not null,
  action text not null,
  type text check (type in ('real_wisdom','stakeholder','system','belief_capital')),
  created_at timestamptz default now()
);

-- =====================================================
-- Real Impact Score dimensions
-- =====================================================

create table if not exists ris_scores (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null,
  entity_type text check (entity_type in ('developer','fund','community')),
  community_outcomes integer default 0,
  financial_performance integer default 0,
  growth_trajectory integer default 0,
  network_depth integer default 0,
  belief_capital integer default 0,
  survival_interventions integer default 0,
  network_activations integer default 0,
  composite_score integer default 0,
  updated_at timestamptz default now()
);

-- =====================================================
-- Belief capital moments
-- =====================================================

create table if not exists belief_capital_moments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals,
  fund_org_id uuid references organizations,
  developer_org_id uuid references organizations,
  description text not null,
  moment_type text check (moment_type in (
    'belief_support','connection','survival_intervention',
    'network_activation','mentorship'
  )),
  downstream_value numeric,
  occurred_at timestamptz default now()
);

-- =====================================================
-- Capital marketplace
-- =====================================================

create table if not exists marketplace_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text,
  description text,
  min_amount numeric,
  max_amount numeric,
  target_regions text[],
  ami_requirements text[],
  deal_types text[],
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists marketplace_matches (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals on delete cascade,
  source_id uuid references marketplace_sources,
  match_score integer,
  match_reason text,
  status text default 'available',
  created_at timestamptz default now()
);

-- =====================================================
-- Portfolio (institution view)
-- =====================================================

create table if not exists portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  fund_org_id uuid references organizations,
  deal_id uuid references deals,
  committed_amount numeric,
  deployed_amount numeric,
  targeted_return numeric,
  relationship_depth_score integer default 0,
  created_at timestamptz default now()
);

-- =====================================================
-- Row-level security
-- =====================================================

alter table deals enable row level security;
alter table capital_sources enable row level security;
alter table checklist_items enable row level security;
alter table milestones enable row level security;
alter table deal_stakeholders enable row level security;
alter table activity_log enable row level security;
alter table belief_capital_moments enable row level security;
alter table portfolio_entries enable row level security;
alter table marketplace_matches enable row level security;
alter table profiles enable row level security;

-- Profiles: a user can read their own profile
drop policy if exists "Users read own profile" on profiles;
create policy "Users read own profile" on profiles
  for select using (id = auth.uid());

drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile" on profiles
  for update using (id = auth.uid());

-- Deals: users see deals belonging to their org
drop policy if exists "Users see their org deals" on deals;
create policy "Users see their org deals" on deals
  for all using (org_id in (
    select org_id from profiles where id = auth.uid()
  ));

-- Public deals: any logged-in user can read deals marked public
drop policy if exists "Anyone reads public deals" on deals;
create policy "Anyone reads public deals" on deals
  for select using (is_public = true);

-- Capital sources scoped to deals the user can see
drop policy if exists "Users see their deal sources" on capital_sources;
create policy "Users see their deal sources" on capital_sources
  for all using (deal_id in (
    select id from deals where org_id in (
      select org_id from profiles where id = auth.uid()
    )
  ));

drop policy if exists "Users see their deal checklist" on checklist_items;
create policy "Users see their deal checklist" on checklist_items
  for all using (deal_id in (
    select id from deals where org_id in (
      select org_id from profiles where id = auth.uid()
    )
  ));

drop policy if exists "Users see their deal milestones" on milestones;
create policy "Users see their deal milestones" on milestones
  for all using (deal_id in (
    select id from deals where org_id in (
      select org_id from profiles where id = auth.uid()
    )
  ));

drop policy if exists "Users see their deal stakeholders" on deal_stakeholders;
create policy "Users see their deal stakeholders" on deal_stakeholders
  for all using (deal_id in (
    select id from deals where org_id in (
      select org_id from profiles where id = auth.uid()
    )
  ));

drop policy if exists "Users see their deal activity" on activity_log;
create policy "Users see their deal activity" on activity_log
  for all using (deal_id in (
    select id from deals where org_id in (
      select org_id from profiles where id = auth.uid()
    )
  ));

drop policy if exists "Users see their deal belief moments" on belief_capital_moments;
create policy "Users see their deal belief moments" on belief_capital_moments
  for all using (deal_id in (
    select id from deals where org_id in (
      select org_id from profiles where id = auth.uid()
    )
  ));

drop policy if exists "Users see their portfolio" on portfolio_entries;
create policy "Users see their portfolio" on portfolio_entries
  for all using (fund_org_id in (
    select org_id from profiles where id = auth.uid()
  ));

drop policy if exists "Users see their marketplace matches" on marketplace_matches;
create policy "Users see their marketplace matches" on marketplace_matches
  for all using (deal_id in (
    select id from deals where org_id in (
      select org_id from profiles where id = auth.uid()
    )
  ));

-- =====================================================
-- Trigger: create a profile row whenever an auth.user is created
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- updated_at triggers
-- =====================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists deals_updated_at on deals;
create trigger deals_updated_at before update on deals
  for each row execute function public.set_updated_at();

drop trigger if exists capital_sources_updated_at on capital_sources;
create trigger capital_sources_updated_at before update on capital_sources
  for each row execute function public.set_updated_at();
