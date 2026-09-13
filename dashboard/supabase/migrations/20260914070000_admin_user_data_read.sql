-- Active administrators may review saved user data. Owner write policies stay intact.
begin;
drop policy if exists property_maps_admin_read on public.property_maps;
create policy property_maps_admin_read on public.property_maps for select to authenticated
using (private.is_active_admin());
drop policy if exists property_assessments_admin_read on public.property_assessments;
create policy property_assessments_admin_read on public.property_assessments for select to authenticated
using (private.is_active_admin());
drop policy if exists observation_photos_admin_read on storage.objects;
create policy observation_photos_admin_read on storage.objects for select to authenticated
using (bucket_id = 'observation-photos' and private.is_active_admin()
  and exists (select 1 from public.properties p
    where p.id::text = (storage.foldername(storage.objects.name))[2]
    and p.owner_id::text = (storage.foldername(storage.objects.name))[1]));
-- Readiness check prevents old owner-only policies looking like empty admin data.
create or replace function public.admin_user_data_ready() returns boolean
language sql stable security invoker set search_path = ''
as $$ select private.is_active_admin(); $$;
revoke all on function public.admin_user_data_ready() from public, anon;
grant execute on function public.admin_user_data_ready() to authenticated;
commit;
