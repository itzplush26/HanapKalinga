drop policy if exists "Nurses: read own" on public.nurses;
create policy "Nurses: read own" on public.nurses
  for select using (id = auth.uid());

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'nurses_provider_document_required_check'
      and conrelid = 'public.nurses'::regclass
  ) then
    alter table public.nurses
      add constraint nurses_provider_document_required_check
      check (
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
      );
  end if;
end
$$;
