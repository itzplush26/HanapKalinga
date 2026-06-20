alter table public.bookings drop constraint if exists bookings_shift_check;
alter table public.bookings
  add constraint bookings_shift_check
  check (shift in ('morning', 'afternoon', 'evening', 'full_day', 'custom'));
