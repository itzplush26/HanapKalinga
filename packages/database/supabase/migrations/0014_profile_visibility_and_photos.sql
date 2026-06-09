-- Family profile photos + allow reading nurse/family profiles where needed for browse & bookings

alter table public.profiles
  add column if not exists profile_photo_url text;

-- Verified nurse profiles are readable on the public browse page
create policy "Profiles: public read verified nurses"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.nurses n
      where n.id = profiles.id
        and n.verification_status = 'verified'
    )
  );

-- Booking participants can read each other's basic profile (messages, booking detail)
create policy "Profiles: read booking participants"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.bookings b
      where (
        b.family_id = auth.uid()
        and b.nurse_id = profiles.id
      )
      or (
        b.nurse_id = auth.uid()
        and b.family_id = profiles.id
      )
    )
  );
