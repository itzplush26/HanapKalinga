-- ONE-TIME repair for a caregiver registered with nurse role / provider_type.
-- Run in Supabase SQL Editor after migration 0027 is applied.

update public.profiles
set role = 'caregiver'
where id = 'd29851b5-d1e2-427a-8ceb-6e061fff77c4';

update public.nurses
set provider_type = 'caregiver'
where id = 'd29851b5-d1e2-427a-8ceb-6e061fff77c4';
