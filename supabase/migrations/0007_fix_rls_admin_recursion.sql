-- Admin RLS checks must not subquery public.profiles inside profiles policies
-- (causes: infinite recursion detected in policy for relation "profiles").

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

drop policy if exists "Profiles: admin read" on public.profiles;
create policy "Profiles: admin read" on public.profiles
  for select using (public.is_admin());

drop policy if exists "Profiles: admin update" on public.profiles;
create policy "Profiles: admin update" on public.profiles
  for update using (public.is_admin());

drop policy if exists "Nurses: admin manage" on public.nurses;
create policy "Nurses: admin manage" on public.nurses
  for all using (public.is_admin());

drop policy if exists "Availability: admin read" on public.availability;
create policy "Availability: admin read" on public.availability
  for select using (public.is_admin());

drop policy if exists "Families: admin read" on public.families;
create policy "Families: admin read" on public.families
  for select using (public.is_admin());

drop policy if exists "Bookings: read participant" on public.bookings;
create policy "Bookings: read participant" on public.bookings
  for select using (
    family_id = auth.uid()
    or nurse_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Bookings: update participant" on public.bookings;
create policy "Bookings: update participant" on public.bookings
  for update using (
    family_id = auth.uid()
    or nurse_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Messages: participant access" on public.messages;
create policy "Messages: participant access" on public.messages
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
      and (b.family_id = auth.uid() or b.nurse_id = auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists "Messages: participant insert" on public.messages;
create policy "Messages: participant insert" on public.messages
  for insert with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
      and (b.family_id = auth.uid() or b.nurse_id = auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists "Messages: participant mark read" on public.messages;
create policy "Messages: participant mark read" on public.messages
  for update using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
      and (b.family_id = auth.uid() or b.nurse_id = auth.uid())
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
      and (b.family_id = auth.uid() or b.nurse_id = auth.uid())
    )
    or public.is_admin()
  );
