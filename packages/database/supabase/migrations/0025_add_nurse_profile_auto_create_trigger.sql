-- Allow pending nurse rows without uploaded documents (onboarding stub).
-- Verified nurses still require the correct credential document for their provider type.

alter table public.nurses drop constraint if exists nurses_provider_document_required_check;

alter table public.nurses
  add constraint nurses_provider_document_required_check
  check (
    verification_status in ('pending', 'under_review', 'resubmission_required', 'rejected')
    or (
      (
        provider_type = 'nurse'
        and prc_document_url is not null
        and tesda_document_url is null
      )
      or (
        provider_type = 'caregiver'
        and tesda_document_url is not null
        and prc_document_url is null
      )
    )
  );

-- Safety net: create nurses row when a profile is saved with role nurse.
create or replace function public.auto_create_nurse_profile_on_role_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'nurse' then
    insert into public.nurses (id, provider_type, verification_status)
    values (new.id, 'nurse', 'pending')
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists auto_create_nurse_profile_on_role_insert on public.profiles;

create trigger auto_create_nurse_profile_on_role_insert
  after insert or update of role on public.profiles
  for each row
  when (new.role = 'nurse')
  execute function public.auto_create_nurse_profile_on_role_insert();
