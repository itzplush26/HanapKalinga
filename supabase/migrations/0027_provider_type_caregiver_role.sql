-- Provider type columns, caregiver profile role, provider table renames, role-lock update.

-- ---------------------------------------------------------------------------
-- nurses: provider_type + TESDA fields (idempotent)
-- ---------------------------------------------------------------------------
alter table public.nurses
  add column if not exists provider_type text,
  add column if not exists tesda_document_url text,
  add column if not exists tesda_certificate_no text;

update public.nurses
set provider_type = 'nurse'
where provider_type is null;

alter table public.nurses
  alter column provider_type set default 'nurse';

alter table public.nurses
  alter column provider_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'nurses_provider_type_check'
      and conrelid = 'public.nurses'::regclass
  ) then
    alter table public.nurses
      add constraint nurses_provider_type_check
      check (provider_type in ('nurse', 'caregiver'));
  end if;
end
$$;

-- Infer caregivers from TESDA doc when provider_type was never set correctly.
update public.nurses
set provider_type = 'caregiver'
where provider_type = 'nurse'
  and tesda_document_url is not null
  and prc_document_url is null;

-- ---------------------------------------------------------------------------
-- profiles: allow caregiver role
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('family', 'nurse', 'caregiver', 'admin'));

update public.profiles p
set role = 'caregiver'
from public.nurses n
where p.id = n.id
  and n.provider_type = 'caregiver'
  and p.role = 'nurse';

-- Allow nurse <-> caregiver correction during onboarding; lock other role changes.
create or replace function public.prevent_role_change()
returns trigger as $$
begin
  if old.role is not null and new.role is distinct from old.role then
    if old.role in ('nurse', 'caregiver') and new.role in ('nurse', 'caregiver') then
      return new;
    end if;
    raise exception 'Role cannot be changed once set';
  end if;
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Rename nurse_ratings view -> provider_ratings (same columns)
-- ---------------------------------------------------------------------------
drop view if exists public.provider_ratings;
create or replace view public.provider_ratings as
select
  reviewee_id as nurse_id,
  round(avg(rating)::numeric, 1) as average_rating,
  count(*)::int as review_count
from public.reviews
group by reviewee_id;

grant select on public.provider_ratings to anon, authenticated;

drop view if exists public.nurse_ratings;

-- ---------------------------------------------------------------------------
-- Rename nurse_weekly_availability -> provider_weekly_availability
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'nurse_weekly_availability'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'provider_weekly_availability'
  ) then
    alter table public.nurse_weekly_availability rename to provider_weekly_availability;
  end if;
end
$$;
