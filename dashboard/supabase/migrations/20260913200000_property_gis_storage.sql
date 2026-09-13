begin;
alter table public.properties add column if not exists cadastral_number text not null default '';
grant insert, delete on public.properties to authenticated;
create policy properties_owner_insert on public.properties for insert to authenticated
with check (owner_id = auth.uid() and created_by = auth.uid() and private.is_active_user());
create policy properties_owner_delete on public.properties for delete to authenticated
using (owner_id = auth.uid() and private.is_active_user());
create table public.property_maps (
  property_id uuid primary key references public.properties(id) on delete cascade,
  data jsonb not null default '{"boundary":[],"observations":[],"notes":""}'::jsonb,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 1000000)
);
alter table public.property_maps enable row level security;
grant select, insert, update on public.property_maps to authenticated;
create policy property_maps_owner on public.property_maps for all to authenticated
using (private.is_active_user() and exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()))
with check (private.is_active_user() and exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()));
-- Assessment inputs are separate from map autosaves.
create table public.property_assessments (
  property_id uuid primary key references public.properties(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) < 50000),
  updated_at timestamptz not null default now()
);
alter table public.property_assessments enable row level security;
grant select, insert, update on public.property_assessments to authenticated;
create policy property_assessments_owner on public.property_assessments for all to authenticated
using (private.is_active_user() and exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()))
with check (private.is_active_user() and exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()));
commit;
