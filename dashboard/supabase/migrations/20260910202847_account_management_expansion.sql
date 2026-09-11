create schema if not exists private;

create type public.account_role as enum (
  'landowner',
  'agency',
  'extension_officer',
  'admin'
);

create type public.account_status as enum (
  'pending',
  'active',
  'declined',
  'inactive'
);

create type public.application_status as enum (
  'draft',
  'ready_for_consent',
  'consented',
  'submitted',
  'withdrawn'
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  phone text,
  organization text,
  job_title text,
  service_area text,
  role public.account_role not null,
  status public.account_status not null default 'pending',
  must_change_password boolean not null default false,
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  deactivated_by uuid references auth.users(id),
  deactivated_at timestamptz,
  deactivation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_unique on public.profiles (lower(email));
create index profiles_role_status_idx on public.profiles (role, status);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(user_id),
  name text not null,
  county text not null,
  address text not null,
  land_type text not null check (land_type in ('farm', 'forest', 'both')),
  approximate_acres numeric(12,2) check (approximate_acres is null or approximate_acres >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_owner_idx on public.properties (owner_id);

create table public.extension_officer_assignments (
  id uuid primary key default gen_random_uuid(),
  landowner_id uuid not null references public.profiles(user_id),
  extension_officer_id uuid not null references public.profiles(user_id),
  assigned_by uuid not null references public.profiles(user_id),
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  check (ended_at is null or not active)
);

create unique index one_active_officer_per_landowner
  on public.extension_officer_assignments (landowner_id)
  where active;
create index assignments_officer_active_idx
  on public.extension_officer_assignments (extension_officer_id, active);

create table public.program_applications (
  id uuid primary key default gen_random_uuid(),
  landowner_id uuid not null references public.profiles(user_id),
  extension_officer_id uuid references public.profiles(user_id),
  agency_profile_id uuid references public.profiles(user_id),
  program_name text not null,
  assessment_reference text,
  status public.application_status not null default 'draft',
  notes text not null default '',
  consented_by uuid references public.profiles(user_id),
  consented_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    status <> 'submitted'
    or (consented_by is not null and consented_at is not null and submitted_at is not null)
  )
);

create index applications_landowner_idx on public.program_applications (landowner_id, status);
create index applications_officer_idx on public.program_applications (extension_officer_id, status);
create index applications_agency_idx on public.program_applications (agency_profile_id, status);

create table public.application_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.program_applications(id) on delete cascade,
  actor_id uuid not null references public.profiles(user_id),
  event_type text not null check (event_type in ('created', 'updated', 'consented', 'submitted', 'withdrawn')),
  notes text,
  created_at timestamptz not null default now()
);

create index application_events_application_idx
  on public.application_events (application_id, created_at desc);

create table public.account_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(user_id),
  target_user_id uuid references public.profiles(user_id),
  action text not null check (
    action in (
      'registered', 'created_by_officer', 'approved', 'declined',
      'deactivated', 'reactivated', 'admin_invited', 'assigned', 'reassigned'
    )
  ),
  reason text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_target_created_idx
  on public.account_audit_events (target_user_id, created_at desc);

create or replace function private.is_active_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = check_user and role = 'admin' and status = 'active'
  );
$$;

create or replace function private.is_active_user(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = check_user and status = 'active'
  );
$$;

create or replace function private.is_active_officer(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = check_user and role = 'extension_officer' and status = 'active'
  );
$$;

create or replace function private.officer_has_landowner(
  check_landowner uuid,
  check_officer uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_active_officer(check_officer) and exists (
    select 1 from public.extension_officer_assignments
    where landowner_id = check_landowner
      and extension_officer_id = check_officer
      and active
  );
$$;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon;
grant execute on function private.is_active_admin(uuid) to authenticated;
grant execute on function private.is_active_user(uuid) to authenticated;
grant execute on function private.is_active_officer(uuid) to authenticated;
grant execute on function private.officer_has_landowner(uuid, uuid) to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.account_role;
  property_id uuid;
begin
  requested_role := case new.raw_user_meta_data ->> 'requested_role'
    when 'agency' then 'agency'::public.account_role
    when 'extension_officer' then 'extension_officer'::public.account_role
    else 'landowner'::public.account_role
  end;

  insert into public.profiles (
    user_id, email, display_name, phone, organization, job_title,
    service_area, role, status
  ) values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'New OARS user'),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'organization', ''),
    nullif(new.raw_user_meta_data ->> 'job_title', ''),
    nullif(new.raw_user_meta_data ->> 'service_area', ''),
    requested_role,
    'pending'
  );

  if requested_role = 'landowner'
    and nullif(new.raw_user_meta_data ->> 'property_name', '') is not null then
    insert into public.properties (
      owner_id, name, county, address, land_type, approximate_acres, created_by
    ) values (
      new.id,
      new.raw_user_meta_data ->> 'property_name',
      new.raw_user_meta_data ->> 'property_county',
      new.raw_user_meta_data ->> 'property_address',
      coalesce(new.raw_user_meta_data ->> 'property_land_type', 'farm'),
      nullif(new.raw_user_meta_data ->> 'property_acres', '')::numeric,
      new.id
    ) returning id into property_id;
  end if;

  insert into public.account_audit_events (target_user_id, action, context)
  values (new.id, 'registered', jsonb_build_object('requested_role', requested_role));
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.prevent_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Audit events are immutable';
end;
$$;

create trigger account_audit_events_immutable
  before update or delete on public.account_audit_events
  for each row execute function private.prevent_audit_mutation();

create trigger application_events_immutable
  before update or delete on public.application_events
  for each row execute function private.prevent_audit_mutation();

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.extension_officer_assignments enable row level security;
alter table public.program_applications enable row level security;
alter table public.application_events enable row level security;
alter table public.account_audit_events enable row level security;

create policy profiles_select on public.profiles for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_active_admin()
  or private.officer_has_landowner(user_id)
);

create policy properties_select on public.properties for select to authenticated
using (
  (owner_id = (select auth.uid()) and private.is_active_user())
  or private.is_active_admin()
  or private.officer_has_landowner(owner_id)
);

create policy properties_owner_update on public.properties for update to authenticated
using (owner_id = (select auth.uid()) and exists (
  select 1 from public.profiles p
  where p.user_id = (select auth.uid()) and p.status = 'active'
))
with check (owner_id = (select auth.uid()));

create policy assignments_select on public.extension_officer_assignments
for select to authenticated
using (
  private.is_active_admin()
  or (extension_officer_id = (select auth.uid()) and private.is_active_officer())
  or (landowner_id = (select auth.uid()) and private.is_active_user())
);

create policy applications_select on public.program_applications for select to authenticated
using (
  private.is_active_admin()
  or (landowner_id = (select auth.uid()) and private.is_active_user())
  or private.officer_has_landowner(landowner_id)
  or (agency_profile_id = (select auth.uid()) and private.is_active_user())
);

create policy applications_insert on public.program_applications for insert to authenticated
with check (
  private.is_active_admin()
  or (landowner_id = (select auth.uid()) and exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid()) and p.status = 'active'
  ))
  or private.officer_has_landowner(landowner_id)
);

create policy applications_update on public.program_applications for update to authenticated
using (
  private.is_active_admin()
  or (landowner_id = (select auth.uid()) and private.is_active_user() and status <> 'submitted')
  or private.officer_has_landowner(landowner_id)
)
with check (
  private.is_active_admin()
  or (landowner_id = (select auth.uid()) and private.is_active_user())
  or private.officer_has_landowner(landowner_id)
);

create policy application_events_select on public.application_events for select to authenticated
using (exists (
  select 1 from public.program_applications a
  where a.id = application_id and (
    private.is_active_admin()
    or (a.landowner_id = (select auth.uid()) and private.is_active_user())
    or private.officer_has_landowner(a.landowner_id)
    or (a.agency_profile_id = (select auth.uid()) and private.is_active_user())
  )
));

create policy audit_admin_select on public.account_audit_events for select to authenticated
using (private.is_active_admin());

grant select on public.profiles to authenticated;
grant select, update on public.properties to authenticated;
grant select on public.extension_officer_assignments to authenticated;
-- Application mutations are intentionally server-only so a browser cannot forge
-- consent, submission, or officer assignment fields. RLS remains defense in depth.
grant select on public.program_applications to authenticated;
grant select on public.application_events to authenticated;
grant select on public.account_audit_events to authenticated;
grant usage, select on all sequences in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;

comment on column public.profiles.role is
  'Trusted application role. Never authorize from auth.users.raw_user_meta_data.';
comment on table public.account_audit_events is
  'Immutable audit history for account and assignment administration.';
