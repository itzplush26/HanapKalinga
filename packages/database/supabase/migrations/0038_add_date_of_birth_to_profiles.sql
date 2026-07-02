alter table public.profiles
  add column if not exists date_of_birth date;

comment on column public.profiles.date_of_birth is
  'Sensitive personal data for identity and professional license verification.';

-- Keep date_of_birth out of broad profile reads.
revoke select (date_of_birth) on public.profiles from anon, authenticated;
grant select (date_of_birth) on public.profiles to service_role;

create or replace function public.get_my_date_of_birth()
returns date
language sql
security definer
set search_path = public
as $$
  select p.date_of_birth
  from public.profiles p
  where p.id = auth.uid()
$$;

grant execute on function public.get_my_date_of_birth() to authenticated;

create or replace function public.get_profile_date_of_birth_for_admin(p_user_id uuid)
returns date
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  return (
    select p.date_of_birth
    from public.profiles p
    where p.id = p_user_id
  );
end;
$$;

grant execute on function public.get_profile_date_of_birth_for_admin(uuid) to authenticated;
