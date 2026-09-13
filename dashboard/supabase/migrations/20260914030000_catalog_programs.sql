-- Workbook records remain read-only. This table stores contributor programs.
create table public.catalog_programs (
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
create function private.catalog_program_updated() returns trigger
language plpgsql set search_path = '' as $$
begin
 if new.created_by is distinct from old.created_by or new.id is distinct from old.id or new.created_at is distinct from old.created_at then
 raise exception 'Program ownership and identity cannot be changed'; end if;
 new.updated_at = clock_timestamp(); return new;
end; $$;
create trigger catalog_program_updated before update on public.catalog_programs for each row execute function private.catalog_program_updated();
alter table public.catalog_programs enable row level security;
grant select on public.catalog_programs to anon, authenticated;
grant insert, update on public.catalog_programs to authenticated;
create policy catalog_public_read on public.catalog_programs for select to anon, authenticated using (status='published');
create policy catalog_editor_read on public.catalog_programs for select to authenticated using (private.can_publish_programs() and (created_by=auth.uid() or private.is_active_admin()));
create policy catalog_editor_insert on public.catalog_programs for insert to authenticated with check (private.can_publish_programs() and created_by=auth.uid());
create policy catalog_editor_update on public.catalog_programs for update to authenticated using (private.can_publish_programs() and (created_by=auth.uid() or private.is_active_admin())) with check (private.can_publish_programs() and (created_by=auth.uid() or private.is_active_admin()));
create index catalog_programs_owner_idx on public.catalog_programs(created_by);
