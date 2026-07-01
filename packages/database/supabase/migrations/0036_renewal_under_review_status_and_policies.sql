-- Add renewal_under_review verification status and keep providers publicly visible while renewal is reviewed.

alter table public.nurses drop constraint if exists nurses_verification_status_check;
alter table public.nurses
  add constraint nurses_verification_status_check
  check (verification_status in (
    'pending',
    'under_review',
    'renewal_under_review',
    'verified',
    'rejected',
    'resubmission_required'
  ));

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
        (
          new.verification_status = 'pending'
          and old.verification_status in ('verified', 'renewal_under_review', 'rejected', 'resubmission_required')
        )
        or (
          new.verification_status = 'renewal_under_review'
          and old.verification_status in ('verified', 'renewal_under_review')
        )
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

drop policy if exists "Nurses: public read verified" on public.nurses;
create policy "Nurses: public read verified" on public.nurses
  for select using (verification_status in ('verified', 'renewal_under_review'));

drop policy if exists "Profiles: public read verified nurses" on public.profiles;
create policy "Profiles: public read verified nurses"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.nurses n
      where n.id = profiles.id
        and n.verification_status in ('verified', 'renewal_under_review')
    )
  );

drop policy if exists "Care requests: public read open" on public.care_requests;
create policy "Care requests: public read open" on public.care_requests
for select using (
  family_id = auth.uid()
  or public.is_admin()
  or (
    status = 'open'
    and exists (
      select 1
      from public.nurses n
      where n.id = auth.uid()
        and n.verification_status in ('verified', 'renewal_under_review')
    )
  )
);
