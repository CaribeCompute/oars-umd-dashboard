-- Versioned OARS MVP reference content. Rows are intentionally not seeded:
-- the repository has no OARS-approved thresholds or program catalog yet.
create table if not exists public.methodology_versions (
  version text primary key,
  label text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'retired')),
  source_url text,
  source_date date,
  reviewed_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.swi_stages (
  id text not null,
  methodology_version text not null references public.methodology_versions(version),
  label text not null,
  min_average numeric(5,2),
  max_average numeric(5,2),
  summary text not null,
  sort_order integer not null,
  primary key (methodology_version, id),
  check ((min_average is null and max_average is null) or (min_average is not null and max_average is not null and min_average <= max_average))
);

create table if not exists public.scorecard_indicators (
  id text not null,
  methodology_version text not null references public.methodology_versions(version),
  label text not null,
  question text not null,
  applies_to text[] not null default array['farm', 'forest'],
  source text,
  active boolean not null default true,
  sort_order integer not null default 0,
  primary key (methodology_version, id)
);

create table if not exists public.indicator_options (
  id uuid primary key default gen_random_uuid(),
  methodology_version text not null,
  indicator_id text not null,
  label text not null,
  score numeric(5,2),
  sort_order integer not null default 0,
  source text,
  unique (methodology_version, indicator_id, sort_order),
  foreign key (methodology_version, indicator_id)
    references public.scorecard_indicators(methodology_version, id)
    on delete cascade
);

create table if not exists public.goals (
  id text primary key,
  label text not null unique,
  description text,
  source text,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'complete')),
  methodology_version text not null references public.methodology_versions(version),
  average_score numeric(5,2),
  total_score numeric(7,2),
  stage_id text,
  limitations_acknowledged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessment_answers (
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  indicator_id text not null,
  option_id uuid references public.indicator_options(id) on delete set null,
  score numeric(5,2),
  notes text,
  primary key (assessment_id, indicator_id)
);

create table if not exists public.assessment_goals (
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  goal_id text not null references public.goals(id),
  priority integer not null check (priority > 0),
  primary key (assessment_id, goal_id),
  unique (assessment_id, priority)
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  resource_type text not null check (resource_type in ('program', 'practice')),
  administering_agency text,
  land_types text[] not null default '{}',
  stage_ids text[] not null default '{}',
  goal_ids text[] not null default '{}',
  description text,
  eligibility text,
  cost_share text,
  enrollment_deadline text,
  expected_timeline text,
  limitations text,
  source_url text,
  source text,
  source_date date,
  last_verified_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete restrict,
  rank integer not null,
  match_score numeric(8,2) not null,
  explanation jsonb not null default '[]'::jsonb,
  methodology_version text not null,
  created_at timestamptz not null default now()
);

alter table public.methodology_versions enable row level security;
alter table public.swi_stages enable row level security;
alter table public.scorecard_indicators enable row level security;
alter table public.indicator_options enable row level security;
alter table public.goals enable row level security;
alter table public.resources enable row level security;

create policy "published reference content is public" on public.methodology_versions for select using (status = 'approved');
create policy "published stages are public" on public.swi_stages for select using (exists (select 1 from public.methodology_versions m where m.version = methodology_version and m.status = 'approved'));
create policy "published indicators are public" on public.scorecard_indicators for select using (exists (select 1 from public.methodology_versions m where m.version = methodology_version and m.status = 'approved'));
create policy "published options are public" on public.indicator_options for select using (exists (select 1 from public.methodology_versions m join public.scorecard_indicators i on i.methodology_version = m.version where i.methodology_version = public.indicator_options.methodology_version and m.status = 'approved'));
create policy "active goals are public" on public.goals for select using (active);
create policy "published resources are public" on public.resources for select using (status = 'published');
