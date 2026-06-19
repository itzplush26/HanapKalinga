-- =============================================================================
-- ONE-TIME REPAIR: profiles with role=nurse but no nurses row
-- =============================================================================
-- Run in Supabase SQL Editor AFTER migration 0025 is applied.
-- Does not delete anything. Safe to run multiple times (skips existing rows).
-- =============================================================================

insert into public.nurses (id, provider_type, verification_status)
select p.id, 'nurse', 'pending'
from public.profiles p
left join public.nurses n on n.id = p.id
where p.role = 'nurse'
  and n.id is null;

-- Verify:
-- select p.id, p.full_name, p.role, n.verification_status
-- from public.profiles p
-- left join public.nurses n on n.id = p.id
-- where p.role = 'nurse';
