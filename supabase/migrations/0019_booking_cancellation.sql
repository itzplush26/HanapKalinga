-- Booking cancellation metadata

alter table public.bookings
  add column if not exists cancelled_by text
    check (cancelled_by is null or cancelled_by in ('family', 'nurse', 'admin')),
  add column if not exists cancellation_reason text;
