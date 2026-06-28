-- Private bucket for PRC / TESDA / NBI verification documents.
-- Upload path from the app: {auth.uid()}/{prc|tesda|nbi|...}/{filename}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nurse-docs',
  'nurse-docs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Authenticated users may upload into their own folder during registration or profile edit.
drop policy if exists "Nurse docs: upload own" on storage.objects;
create policy "Nurse docs: upload own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'nurse-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Nurse docs: read own" on storage.objects;
create policy "Nurse docs: read own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'nurse-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- upsert: true in the client requires update on existing paths.
drop policy if exists "Nurse docs: update own" on storage.objects;
create policy "Nurse docs: update own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'nurse-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'nurse-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins review documents in the verification queue (signed URLs).
drop policy if exists "Nurse docs: admin read" on storage.objects;
create policy "Nurse docs: admin read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'nurse-docs'
  and public.is_admin()
);
