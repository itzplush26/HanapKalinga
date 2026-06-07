create or replace view public.nurse_ratings as
select
  reviewee_id as nurse_id,
  round(avg(rating)::numeric, 1) as average_rating,
  count(*)::int as review_count
from public.reviews
group by reviewee_id;

grant select on public.nurse_ratings to anon, authenticated;

drop policy if exists "Messages: participant mark read" on public.messages;
create policy "Messages: participant mark read" on public.messages
  for update using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
      and (b.family_id = auth.uid() or b.nurse_id = auth.uid())
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
      and (b.family_id = auth.uid() or b.nurse_id = auth.uid())
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
