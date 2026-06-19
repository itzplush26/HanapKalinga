create index if not exists idx_bookings_family_id
  on public.bookings (family_id);

create index if not exists idx_bookings_nurse_id
  on public.bookings (nurse_id);

create index if not exists idx_bookings_status
  on public.bookings (status);

create index if not exists idx_messages_booking_id
  on public.messages (booking_id);

create index if not exists idx_care_requests_family_id
  on public.care_requests (family_id);

create index if not exists idx_care_requests_status
  on public.care_requests (status);

create index if not exists idx_care_requests_expires_at
  on public.care_requests (expires_at);

create index if not exists idx_incident_reports_status
  on public.incident_reports (status);
