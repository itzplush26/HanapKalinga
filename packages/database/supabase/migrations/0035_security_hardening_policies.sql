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
        and n.verification_status = 'verified'
    )
  )
);

create or replace function public.enforce_booking_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.family_id is distinct from old.family_id or new.nurse_id is distinct from old.nurse_id then
    raise exception 'Booking participants cannot be changed.';
  end if;

  if auth.uid() = old.family_id then
    if new.status is distinct from old.status then
      if not (
        (old.status = 'pending' and new.status = 'cancelled')
        or (old.status = 'accepted' and new.status = 'cancelled')
        or (old.status = 'pending_completion' and new.status in ('completed', 'disputed'))
      ) then
        raise exception 'Invalid booking status transition for family.';
      end if;
    end if;
    return new;
  end if;

  if auth.uid() = old.nurse_id then
    if new.status is distinct from old.status then
      if not (
        (old.status = 'pending' and new.status in ('accepted', 'declined'))
        or (old.status = 'accepted' and new.status in ('cancelled', 'pending_completion'))
      ) then
        raise exception 'Invalid booking status transition for nurse.';
      end if;
    end if;
    return new;
  end if;

  raise exception 'Forbidden booking update.';
end;
$$;

drop trigger if exists bookings_enforce_status_transition on public.bookings;
create trigger bookings_enforce_status_transition
before update on public.bookings
for each row execute function public.enforce_booking_status_transition();
