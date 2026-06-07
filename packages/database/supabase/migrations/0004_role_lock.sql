create or replace function public.prevent_role_change()
returns trigger as $$
begin
  if old.role is not null and new.role is distinct from old.role then
    raise exception 'Role cannot be changed once set';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists prevent_role_change on public.profiles;
create trigger prevent_role_change
before update on public.profiles
for each row execute function public.prevent_role_change();