alter table public.profiles
  add column if not exists name_suffix text;
