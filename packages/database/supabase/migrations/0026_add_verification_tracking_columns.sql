-- verified_at and rejection_reason already exist from 0001_init.sql

alter table public.nurses
  add column if not exists verified_by uuid references public.profiles(id);

alter table public.nurses
  add column if not exists verification_notes text;

alter table public.nurses
  add column if not exists rejection_notes text;
