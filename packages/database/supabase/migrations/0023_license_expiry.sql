-- License and clearance expiry tracking

alter table public.nurses
  add column if not exists prc_license_expiry date,
  add column if not exists tesda_cert_expiry date,
  add column if not exists nbi_expiry date,
  add column if not exists license_expiry_notified_at timestamptz;
