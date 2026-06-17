alter table public.profiles
  add column if not exists suspended_at timestamptz,
  add column if not exists unsuspended_at timestamptz,
  add column if not exists suspension_reason text;
