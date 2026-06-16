-- =============================================================================
-- HanapKalinga: wipe family + nurse/caregiver data (KEEP admins)
-- =============================================================================
-- Run in Supabase SQL Editor as service role / postgres.
-- This removes app data and auth accounts for families and nurses only.
-- Admin profiles and admin auth.users rows are preserved.
--
-- Does NOT delete storage objects (avatars, documents). Clean buckets separately
-- in Supabase Dashboard → Storage if needed.
-- =============================================================================

begin;

-- Target users to remove (all non-admin profiles)
create temp table _users_to_delete on commit drop as
select id
from public.profiles
where role in ('family', 'nurse');

-- Child tables (order matters for FKs without cascade to profiles)
delete from public.care_request_applications
where nurse_id in (select id from _users_to_delete)
   or care_request_id in (
     select id from public.care_requests where family_id in (select id from _users_to_delete)
   );

delete from public.care_requests
where family_id in (select id from _users_to_delete);

delete from public.messages
where sender_id in (select id from _users_to_delete)
   or booking_id in (
     select id from public.bookings
     where family_id in (select id from _users_to_delete)
        or nurse_id in (select id from _users_to_delete)
   );

delete from public.reviews
where reviewer_id in (select id from _users_to_delete)
   or reviewee_id in (select id from _users_to_delete);

delete from public.incident_reports
where reporter_id in (select id from _users_to_delete)
   or reported_user_id in (select id from _users_to_delete);

delete from public.user_blocks
where blocker_id in (select id from _users_to_delete)
   or blocked_id in (select id from _users_to_delete);

delete from public.bookings
where family_id in (select id from _users_to_delete)
   or nurse_id in (select id from _users_to_delete);

delete from public.notifications
where user_id in (select id from _users_to_delete);

delete from public.verification_audit_logs
where nurse_id in (select id from _users_to_delete);

delete from public.availability_date_exceptions
where nurse_id in (select id from _users_to_delete);

delete from public.provider_weekly_availability
where nurse_id in (select id from _users_to_delete);

delete from public.availability
where nurse_id in (select id from _users_to_delete);

delete from public.user_sessions
where user_id in (select id from _users_to_delete);

-- Role tables cascade from profiles, but delete explicitly for clarity
delete from public.nurses where id in (select id from _users_to_delete);
delete from public.families where id in (select id from _users_to_delete);

delete from public.profiles
where id in (select id from _users_to_delete);

-- Removes auth users (cascades anything left linked to auth.users)
delete from auth.users
where id in (select id from _users_to_delete);

commit;

-- Verify admins remain
select id, role, full_name, created_at
from public.profiles
where role = 'admin'
order by created_at;
