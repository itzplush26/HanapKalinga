-- Mutual booking completion flow

alter table public.bookings
  add column if not exists nurse_marked_complete boolean not null default false,
  add column if not exists family_marked_complete boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in (
    'pending', 'accepted', 'declined', 'completed', 'cancelled',
    'pending_completion', 'disputed'
  ));

create or replace function public.set_bookings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_bookings_updated_at();
