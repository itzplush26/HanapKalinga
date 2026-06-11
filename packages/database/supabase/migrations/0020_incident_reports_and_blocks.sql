-- Incident reporting, user blocks, and profile suspension

alter table public.profiles
  add column if not exists suspended boolean not null default false;

create table if not exists public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  category text not null,
  description text not null,
  evidence_url text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'resolved')),
  admin_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

alter table public.incident_reports enable row level security;
alter table public.user_blocks enable row level security;

create policy "Incident reports: insert own"
on public.incident_reports for insert
to authenticated
with check (reporter_id = auth.uid());

create policy "Incident reports: read own"
on public.incident_reports for select
to authenticated
using (reporter_id = auth.uid());

create policy "Incident reports: admin all"
on public.incident_reports for all
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "User blocks: manage own"
on public.user_blocks for all
to authenticated
using (blocker_id = auth.uid())
with check (blocker_id = auth.uid());

create policy "User blocks: admin read"
on public.user_blocks for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
