-- Human-readable nurse profile slugs

alter table public.nurses
  add column if not exists profile_slug text unique;

create index if not exists nurses_profile_slug_idx on public.nurses (profile_slug);

create or replace function public.slugify_name(input text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, 'nurse')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.generate_nurse_profile_slug(p_nurse_id uuid, p_full_name text)
returns text language plpgsql as $$
declare
  base text;
  suffix text;
  candidate text;
  counter int := 0;
begin
  suffix := left(replace(p_nurse_id::text, '-', ''), 4);
  base := public.slugify_name(p_full_name) || '-' || suffix;
  candidate := base;
  while exists (select 1 from public.nurses where profile_slug = candidate and id <> p_nurse_id) loop
    counter := counter + 1;
    candidate := base || '-' || counter::text;
  end loop;
  return candidate;
end;
$$;
