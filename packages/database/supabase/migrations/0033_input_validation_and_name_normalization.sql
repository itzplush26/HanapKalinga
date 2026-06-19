alter table public.profiles
  add column if not exists terms_accepted_at timestamptz;

update public.profiles
set
  first_name = initcap(lower(trim(first_name))),
  middle_name = initcap(lower(trim(middle_name))),
  last_name = initcap(lower(trim(last_name)))
where
  first_name is not null
  or middle_name is not null
  or last_name is not null;

update public.families
set patient_name = initcap(lower(trim(patient_name)))
where patient_name is not null;
