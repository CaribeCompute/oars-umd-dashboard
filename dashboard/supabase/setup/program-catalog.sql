-- Paste this entire file into the Supabase SQL editor and run it once.
-- Repairs missing program setup and can be rerun after either program migration.
-- Existing program rows are preserved. Requires the OARS account migrations.
begin;
do $$ begin
 if to_regclass('public.profiles') is null or to_regprocedure('private.is_active_admin(uuid)') is null then
  raise exception 'Apply the OARS account management migrations before program setup.';
 end if;
end $$;
-- Workbook records remain read-only. This table stores contributor programs.
create table if not exists public.catalog_programs (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 name text not null check (length(trim(name)) between 1 and 5000),
 agency text not null check (length(trim(agency)) between 1 and 5000),
 description text not null check (length(trim(description)) between 1 and 5000),
 county text not null default '' check(length(county)<=5000),
 eligibility text not null default '' check(length(eligibility)<=5000),
 cost_share text not null default '' check(length(cost_share)<=5000),
 timeline text not null default '' check(length(timeline)<=5000),
 website text not null default '' check(length(website)<=5000 and (website='' or website ~ '^https?://[^[:space:]]+$')),
 type text not null check(type in ('Program','Practice')),
 land text not null check(land in ('farm','forest','both','unspecified')),
 scope text not null check(scope in ('Federal','MD','DE','NJ','VA','Private')),
 status text not null default 'draft' check(status in ('draft','published'))
);
create or replace function private.can_publish_programs() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where user_id=auth.uid() and status='active' and role in ('agency','extension_officer','admin'));
$$;
revoke all on function private.can_publish_programs() from public;
grant execute on function private.can_publish_programs() to authenticated;
create or replace function private.catalog_program_updated() returns trigger
language plpgsql set search_path = '' as $$
begin
 if new.created_by is distinct from old.created_by or new.id is distinct from old.id or new.created_at is distinct from old.created_at then
 raise exception 'Program ownership and identity cannot be changed'; end if;
 new.updated_at = clock_timestamp(); return new;
end; $$;
drop trigger if exists catalog_program_updated on public.catalog_programs;
create trigger catalog_program_updated before update on public.catalog_programs for each row execute function private.catalog_program_updated();
alter table public.catalog_programs enable row level security;
grant select on public.catalog_programs to anon, authenticated;
grant insert, update on public.catalog_programs to authenticated;
drop policy if exists catalog_public_read on public.catalog_programs;
create policy catalog_public_read on public.catalog_programs for select to anon, authenticated using (status='published');
drop policy if exists catalog_editor_read on public.catalog_programs;
create policy catalog_editor_read on public.catalog_programs for select to authenticated using (private.can_publish_programs() and (created_by=auth.uid() or private.is_active_admin()));
drop policy if exists catalog_editor_insert on public.catalog_programs;
create policy catalog_editor_insert on public.catalog_programs for insert to authenticated with check (private.can_publish_programs() and created_by=auth.uid());
drop policy if exists catalog_editor_update on public.catalog_programs;
create policy catalog_editor_update on public.catalog_programs for update to authenticated using (private.can_publish_programs() and (created_by=auth.uid() or private.is_active_admin())) with check (private.can_publish_programs() and (created_by=auth.uid() or private.is_active_admin()));
create index if not exists catalog_programs_owner_idx on public.catalog_programs(created_by);

-- Run after 20260914030000_catalog_programs.sql. Existing entries retain their data.
alter table public.catalog_programs add column if not exists "programName" text not null default '' check (length("programName") <= 5000);
alter table public.catalog_programs add column if not exists "landDescription" text not null default '' check (length("landDescription") <= 5000);
alter table public.catalog_programs add column if not exists "scopeDetail" text not null default '' check (length("scopeDetail") <= 5000);
alter table public.catalog_programs add column if not exists "requirements" text not null default '' check (length("requirements") <= 5000);
alter table public.catalog_programs add column if not exists "practice" text not null default '' check (length("practice") <= 5000);
alter table public.catalog_programs add column if not exists "code" text not null default '' check (length("code") <= 5000);
alter table public.catalog_programs add column if not exists "strategies" text not null default '' check (length("strategies") <= 5000);
alter table public.catalog_programs add column if not exists "swiStrategies" text not null default '' check (length("swiStrategies") <= 5000);
alter table public.catalog_programs add column if not exists "goals" text not null default '' check (length("goals") <= 5000);
alter table public.catalog_programs add column if not exists "benefit" text not null default '' check (length("benefit") <= 5000);
alter table public.catalog_programs add column if not exists "duration" text not null default '' check (length("duration") <= 5000);
alter table public.catalog_programs add column if not exists "nextStep" text not null default '' check (length("nextStep") <= 5000);
alter table public.catalog_programs add column if not exists "personnel" text not null default '' check (length("personnel") <= 5000);
alter table public.catalog_programs add column if not exists "contacts" text not null default '' check (length("contacts") <= 5000);
alter table public.catalog_programs add column if not exists "experts" text not null default '' check (length("experts") <= 5000);
alter table public.catalog_programs add column if not exists "limitations" text not null default '' check (length("limitations") <= 5000);
alter table public.catalog_programs add column if not exists "quantitative" text not null default '' check (length("quantitative") <= 5000);
alter table public.catalog_programs add column if not exists "qualitative" text not null default '' check (length("qualitative") <= 5000);
alter table public.catalog_programs add column if not exists "notes" text not null default '' check (length("notes") <= 5000);
alter table public.catalog_programs add column if not exists "stage" text not null default '' check (length("stage") <= 5000);
alter table public.catalog_programs add column if not exists "deadline" text not null default '' check (length("deadline") <= 5000);
alter table public.catalog_programs add column if not exists "practiceWebsite" text not null default '' check (length("practiceWebsite") <= 5000 and ("practiceWebsite" = '' or "practiceWebsite" ~ '^https?://[^[:space:]]+$'));
alter table public.catalog_programs add column if not exists "overviewUrl" text not null default '' check (length("overviewUrl") <= 5000 and ("overviewUrl" = '' or "overviewUrl" ~ '^https?://[^[:space:]]+$'));

notify pgrst, 'reload schema';
commit;

-- Verify the table and all program fields are available.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'catalog_programs'
order by ordinal_position;
