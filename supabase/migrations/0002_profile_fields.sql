alter table public.profiles
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists last_name text,
  add column if not exists region text,
  add column if not exists address text;

alter table public.nurses
  add column if not exists profile_photo_url text;
