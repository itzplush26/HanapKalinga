-- Fix avatars bucket RLS: upsert requires select (and often delete) in addition to insert/update.

drop policy if exists "Avatars: public read" on storage.objects;
create policy "Avatars: public read"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "Avatars: upload own" on storage.objects;
create policy "Avatars: upload own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Avatars: update own" on storage.objects;
create policy "Avatars: update own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Avatars: delete own" on storage.objects;
create policy "Avatars: delete own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);
