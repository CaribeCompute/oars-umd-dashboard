begin;
-- Private originals: owner/property/observation/file. Public catalog photos use a separate path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('observation-photos', 'observation-photos', false, 10485760, array['image/jpeg','image/png'])
on conflict (id) do nothing;
create policy observation_photos_owner_read on storage.objects for select to authenticated
using (bucket_id = 'observation-photos' and (storage.foldername(name))[1] = auth.uid()::text and private.is_active_user()
  and exists (select 1 from public.properties p where p.id::text = (storage.foldername(name))[2] and p.owner_id = auth.uid()));
create policy observation_photos_owner_upload on storage.objects for insert to authenticated
with check (bucket_id = 'observation-photos' and (storage.foldername(name))[1] = auth.uid()::text and private.is_active_user()
  and exists (select 1 from public.properties p join public.property_maps m on m.property_id = p.id
    where p.id::text = (storage.foldername(name))[2] and p.owner_id = auth.uid()
    and exists (select 1 from jsonb_array_elements(m.data->'observations') o where o->>'id' = (storage.foldername(name))[3])));
-- Allow owners to remove their files even after deleting an observation/property.
create policy observation_photos_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'observation-photos' and (storage.foldername(name))[1] = auth.uid()::text and private.is_active_user());
commit;
