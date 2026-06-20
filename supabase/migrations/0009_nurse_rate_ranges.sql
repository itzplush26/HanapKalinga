-- Optional rate range metadata for nurses (existing numeric rates remain valid).
alter table public.nurses
  add column if not exists hourly_rate_max numeric,
  add column if not exists daily_rate_12hr_max numeric,
  add column if not exists hourly_rate_range text,
  add column if not exists daily_rate_range text;
