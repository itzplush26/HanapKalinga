-- Add missing INSERT policy for verification_audit_logs.
-- Only admins (checked via public.is_admin()) can insert audit entries.
-- Without this policy, the approve/reject actions fail with RLS violation,
-- and the nurse status update succeeds but the audit trail is missing,
-- leading to cascading test failures.

drop policy if exists "Verification audit: admin insert" on public.verification_audit_logs;
create policy "Verification audit: admin insert" on public.verification_audit_logs
  for insert with check (public.is_admin());
