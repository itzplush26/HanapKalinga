-- Care requests (job board) and applications

create table if not exists public.care_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  patient_condition text not null,
  care_type text not null check (care_type in ('full_time', 'part_time', 'live_in', 'per_shift')),
  required_specializations text[] not null default '{}',
  preferred_provider_type text not null default 'both'
    check (preferred_provider_type in ('nurse', 'caregiver', 'both')),
  region text,
  city text,
  budget_band text,
  shift_preference text,
  start_date date,
  duration_description text,
  status text not null default 'open' check (status in ('open', 'filled', 'closed')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create table if not exists public.care_request_applications (
  id uuid primary key default gen_random_uuid(),
  care_request_id uuid not null references public.care_requests(id) on delete cascade,
  nurse_id uuid not null references public.nurses(id) on delete cascade,
  cover_message text not null,
  proposed_rate_band text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (care_request_id, nurse_id)
);

alter table public.care_requests enable row level security;
alter table public.care_request_applications enable row level security;

create policy "Care requests: public read open"
on public.care_requests for select
using (status = 'open' or family_id = auth.uid());

create policy "Care requests: family insert own"
on public.care_requests for insert
with check (family_id = auth.uid());

create policy "Care requests: family update own"
on public.care_requests for update
using (family_id = auth.uid());

create policy "Care requests: admin all"
on public.care_requests for all
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "Applications: nurse insert own"
on public.care_request_applications for insert
with check (nurse_id = auth.uid());

create policy "Applications: nurse update own withdraw"
on public.care_request_applications for update
using (nurse_id = auth.uid());

create policy "Applications: family read for own requests"
on public.care_request_applications for select
using (
  exists (
    select 1 from public.care_requests cr
    where cr.id = care_request_id and cr.family_id = auth.uid()
  )
  or nurse_id = auth.uid()
);

create policy "Applications: family update status"
on public.care_request_applications for update
using (
  exists (
    select 1 from public.care_requests cr
    where cr.id = care_request_id and cr.family_id = auth.uid()
  )
);

create policy "Applications: admin all"
on public.care_request_applications for all
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
