-- Qualify the outer storage object path: properties also has a name column.
begin;
alter policy observation_photos_owner_read on storage.objects to authenticated
using (bucket_id = 'observation-photos' and (storage.foldername(storage.objects.name))[1] = auth.uid()::text and private.is_active_user()
  and exists (select 1 from public.properties p where p.id::text = (storage.foldername(storage.objects.name))[2] and p.owner_id = auth.uid()));
alter policy observation_photos_owner_upload on storage.objects to authenticated
with check (bucket_id = 'observation-photos' and (storage.foldername(storage.objects.name))[1] = auth.uid()::text and private.is_active_user()
  and exists (select 1 from public.properties p join public.property_maps m on m.property_id = p.id
    where p.id::text = (storage.foldername(storage.objects.name))[2] and p.owner_id = auth.uid()
    and exists (select 1 from jsonb_array_elements(m.data->'observations') o where o->>'id' = (storage.foldername(storage.objects.name))[3])));
commit;
