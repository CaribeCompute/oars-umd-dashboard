alter table public.profiles
  add column if not exists farmer_id text;

alter table public.profiles
  add constraint profiles_farmer_id_not_blank
  check (farmer_id is null or btrim(farmer_id) <> '');

create unique index if not exists profiles_farmer_id_unique
  on public.profiles (lower(farmer_id))
  where farmer_id is not null;

alter table public.properties
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists address_verified_at timestamptz,
  add column if not exists address_provider text;

alter table public.properties
  add constraint properties_latitude_range
  check (latitude is null or latitude between -90 and 90),
  add constraint properties_longitude_range
  check (longitude is null or longitude between -180 and 180),
  add constraint properties_address_verification_complete
  check (
    (address_verified_at is null and address_provider is null)
    or (address_verified_at is not null and address_provider is not null and latitude is not null and longitude is not null)
  );

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.account_role;
begin
  requested_role := case new.raw_user_meta_data ->> 'requested_role'
    when 'agency' then 'agency'::public.account_role
    when 'extension_officer' then 'extension_officer'::public.account_role
    else 'landowner'::public.account_role
  end;

  insert into public.profiles (
    user_id, email, display_name, phone, farmer_id, organization, job_title,
    service_area, role, status
  ) values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'New OARS user'),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case when requested_role = 'landowner' then nullif(new.raw_user_meta_data ->> 'farmer_id', '') else null end,
    nullif(new.raw_user_meta_data ->> 'organization', ''),
    nullif(new.raw_user_meta_data ->> 'job_title', ''),
    nullif(new.raw_user_meta_data ->> 'service_area', ''),
    requested_role,
    'pending'
  );

  if requested_role = 'landowner'
    and nullif(new.raw_user_meta_data ->> 'property_name', '') is not null then
    insert into public.properties (
      owner_id, name, county, address, land_type, approximate_acres, latitude,
      longitude, address_verified_at, address_provider, created_by
    ) values (
      new.id,
      new.raw_user_meta_data ->> 'property_name',
      new.raw_user_meta_data ->> 'property_county',
      new.raw_user_meta_data ->> 'property_address',
      coalesce(new.raw_user_meta_data ->> 'property_land_type', 'farm'),
      nullif(new.raw_user_meta_data ->> 'property_acres', '')::numeric,
      nullif(new.raw_user_meta_data ->> 'property_latitude', '')::double precision,
      nullif(new.raw_user_meta_data ->> 'property_longitude', '')::double precision,
      case when nullif(new.raw_user_meta_data ->> 'property_latitude', '') is not null then now() else null end,
      case when nullif(new.raw_user_meta_data ->> 'property_latitude', '') is not null then 'nominatim' else null end,
      new.id
    );
  end if;

  insert into public.account_audit_events (target_user_id, action, context)
  values (new.id, 'registered', jsonb_build_object('requested_role', requested_role));
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
