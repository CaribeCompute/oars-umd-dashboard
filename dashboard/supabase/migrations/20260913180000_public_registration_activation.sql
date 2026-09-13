-- Public landowners and agencies no longer need administrator approval.
-- OAuth users without registration metadata remain pending until callback completion.
-- Administrator privileges still require an existing administrator's invitation.
begin;

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
    case when new.raw_user_meta_data ->> 'requested_role' in ('landowner', 'agency')
      then 'active'::public.account_status else 'pending'::public.account_status end
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

-- Release completed registrations already waiting under the previous policy.
-- Never reactivate declined/inactive accounts or incomplete Google profiles.
with activated as (
  update public.profiles p set status = 'active'
  where p.status = 'pending' and (
    (p.role = 'landowner' and p.farmer_id is not null and exists (
      select 1 from public.properties prop where prop.owner_id = p.user_id
    )) or
    (p.role = 'agency' and nullif(p.organization, '') is not null
      and nullif(p.job_title, '') is not null and nullif(p.service_area, '') is not null)
  )
  returning user_id
)
insert into public.account_audit_events (target_user_id, action, context)
select user_id, 'approved', '{"reason":"public_registration_policy_change","automatic":true}'::jsonb
from activated;

commit;
