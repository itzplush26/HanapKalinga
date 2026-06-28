-- Full-text search on nurse profiles

alter table public.nurses
  add column if not exists search_vector tsvector;

create index if not exists nurses_search_vector_idx
  on public.nurses using gin (search_vector);

create or replace function public.refresh_nurse_search_vector(p_nurse_id uuid)
returns void language plpgsql security definer as $$
declare
  v_name text;
  v_bio text;
  v_specs text;
begin
  select p.full_name, n.bio, coalesce(array_to_string(n.specializations, ' '), '')
  into v_name, v_bio, v_specs
  from public.nurses n
  join public.profiles p on p.id = n.id
  where n.id = p_nurse_id;

  update public.nurses
  set search_vector =
    setweight(to_tsvector('english', coalesce(v_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(v_bio, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(v_specs, '')), 'C')
  where id = p_nurse_id;
end;
$$;

create or replace function public.nurses_search_vector_from_nurses()
returns trigger language plpgsql as $$
begin
  perform public.refresh_nurse_search_vector(new.id);
  return new;
end;
$$;

create or replace function public.nurses_search_vector_from_profiles()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.nurses where id = new.id) then
    perform public.refresh_nurse_search_vector(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists nurses_search_vector_trigger on public.nurses;
create trigger nurses_search_vector_trigger
  after insert or update of bio, specializations on public.nurses
  for each row execute function public.nurses_search_vector_from_nurses();

drop trigger if exists profiles_search_vector_trigger on public.profiles;
create trigger profiles_search_vector_trigger
  after update of full_name on public.profiles
  for each row execute function public.nurses_search_vector_from_profiles();

-- Backfill existing nurses
do $$
declare r record;
begin
  for r in select id from public.nurses loop
    perform public.refresh_nurse_search_vector(r.id);
  end loop;
end;
$$;
