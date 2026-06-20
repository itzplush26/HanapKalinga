alter table public.families
  add column if not exists contact_person_name text,
  add column if not exists relationship_to_patient text,
  add column if not exists care_needed text;

alter table public.nurses
  add column if not exists provider_type text,
  add column if not exists tesda_document_url text;

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