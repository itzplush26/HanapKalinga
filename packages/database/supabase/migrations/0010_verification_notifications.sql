-- Extended verification statuses, notifications, audit logs, and nurse status protection.

alter table public.nurses
  add column if not exists submitted_at timestamptz default now();

alter table public.nurses drop constraint if exists nurses_verification_status_check;
alter table public.nurses
  add constraint nurses_verification_status_check
  check (verification_status in (
    'pending',
    'under_review',
    'verified',
    'rejected',
    'resubmission_required'
  ));

update public.nurses
set submitted_at = coalesce(submitted_at, verified_at, now())
where submitted_at is null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

create table if not exists public.verification_audit_logs (
  id uuid primary key default gen_random_uuid(),
  nurse_id uuid not null references public.nurses(id) on delete cascade,
  admin_id uuid not null references auth.users(id),
  action text not null,
  previous_status text,
  new_status text not null,
  rejection_reason text,
  review_notes text,
  created_at timestamptz not null default now()
);

create index if not exists verification_audit_logs_nurse_id_created_at_idx
  on public.verification_audit_logs (nurse_id, created_at desc);

alter table public.notifications enable row level security;
alter table public.verification_audit_logs enable row level security;

drop policy if exists "Notifications: read own" on public.notifications;
create policy "Notifications: read own" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "Notifications: update own" on public.notifications;
create policy "Notifications: update own" on public.notifications
  for update using (user_id = auth.uid());

drop policy if exists "Verification audit: admin read" on public.verification_audit_logs;
create policy "Verification audit: admin read" on public.verification_audit_logs
  for select using (public.is_admin());

create or replace function public.prevent_nurse_verification_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = new.id and not public.is_admin() then
    if new.verification_status is distinct from old.verification_status then
      if not (
        new.verification_status = 'pending'
        and old.verification_status in ('rejected', 'resubmission_required')
      ) then
        raise exception 'Nurses cannot change their own verification status.';
      end if;
    end if;

    if new.verified_at is distinct from old.verified_at then
      raise exception 'Nurses cannot change verification timestamps.';
    end if;

    if new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'Nurses cannot change rejection reasons.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists nurses_prevent_verification_tampering on public.nurses;
create trigger nurses_prevent_verification_tampering
  before update on public.nurses
  for each row
  execute function public.prevent_nurse_verification_tampering();
