## HanapKalinga Focused Re-Audit (Read-Only)

| Item | Description | Verdict |
|---|---|---|
| 1 | Suspended user login blocking | VERIFIED |
| 2 | Review API booking ownership validation | VERIFIED |
| 3 | Care request expiry cron | VERIFIED |
| 4 | Verification emails using Resend consistently | PARTIAL |
| 5 | Database types regenerated | PARTIAL |
| 6 | Block enforcement in browse and messaging | PARTIAL |
| 7 | Missing database indexes | VERIFIED |
| 8 | CI secret scanning alignment | VERIFIED |
| 9 | Document upload route role check | PARTIAL |
| 10 | Single vercel.json resolved | VERIFIED |
| 11 | Booking and review status types updated | VERIFIED |
| 12 | Admin page type safety | VERIFIED |
| 13 | Booking and report error messages | PARTIAL |
| 14 | Terms checkbox persistence across steps | PARTIAL |
| 15 | Profanity filter | VERIFIED |
| 16 | Phone number validation | PARTIAL |
| 17 | Name title case formatting | VERIFIED |
| 18 | Service role key error handling | VERIFIED |
| 19 | Terms and Privacy content updated | VERIFIED |

## Per-Item Verdicts

1. **VERIFIED** — `apps/web/app/login/page.tsx`, `apps/web/middleware.ts`, `apps/web/app/api/admin/suspend/route.ts`, `apps/web/app/admin/verifications/[id]/page.tsx`, `apps/web/app/admin/families/[id]/page.tsx`, `packages/database/supabase/migrations/0020_incident_reports_and_blocks.sql`, `packages/database/supabase/migrations/0031_profile_suspension_metadata.sql`: sign-in and middleware enforce suspension, admin-only suspend API exists, suspend controls exist on admin detail pages, and required profile columns exist in migrations.
2. **VERIFIED** — `apps/web/app/api/reviews/route.ts`: route enforces booking exists, booking ownership, nurse match, completed status, and duplicate-review prevention, returning `403` on failed ownership/state checks.
3. **VERIFIED** — `apps/web/app/api/cron/check-expiry/route.ts`, `apps/web/lib/cron-auth.ts`, `vercel.json`: cron closes expired open care requests, creates notifications, sends expiry emails, is scheduled in Vercel, and is protected by `CRON_SECRET`.
4. **PARTIAL** — `apps/web/app/api/admin/verification/route.ts`, `apps/web/lib/email/send.ts`: verification route now uses `sendEmail` directly (awaited) and has no SMTP import in that file, but it does not use `sendEmailSafe` as requested.
5. **PARTIAL** — `apps/web/types/database.types.ts`: file is real generated-style output, but missing newer fields such as `profiles.terms_accepted_at`, `profiles.suspension_reason`, `profiles.suspended_at`, and `profiles.unsuspended_at`.
6. **PARTIAL** — `apps/web/app/nurses/page.tsx`, `apps/web/app/api/messages/route.ts`, `apps/web/components/message-thread.tsx`: message API and thread block handling are correct, but browse blocking is applied only when viewer role is `family`, not all authenticated users.
7. **VERIFIED** — `packages/database/supabase/migrations/0032_hot_path_indexes.sql`: all requested indexes are present using `create index if not exists`.
8. **VERIFIED** — `.cursorrules`, `.cursor/rules/hanapkalinga-ci-gate.mdc`: secret-scan commands and patterns match, including server-side `NEXT_PUBLIC_` scan target.
9. **PARTIAL** — `apps/web/app/api/upload/document/route.ts`, `apps/web/lib/storage/upload-auth.ts`: role is fetched after auth and checked early, but route allows providers/admins instead of enforcing nurse-only `403` for non-nurse roles.
10. **VERIFIED** — `vercel.json`: only one Vercel config file exists in repo, active config includes `sin1` and cron schedule entries.
11. **VERIFIED** — `packages/shared/src/types.ts`: `BookingStatus` includes `pending_completion` and `disputed`, `Shift` includes `custom`, and `Review` field names match DB naming.
12. **VERIFIED** — `apps/web/app/admin/families/page.tsx`, `apps/web/app/admin/nurses/page.tsx`, `apps/web/app/admin/verifications/page.tsx`, `apps/web/app/admin/verifications/[id]/page.tsx`, `apps/web/app/admin/families/[id]/page.tsx`: admin pages are server components (no `useEffect` fetch pattern), and no `any` usage was found in admin components checked.
13. **PARTIAL** — `apps/web/app/dashboard/nurse/bookings/[id]/page.tsx`, `apps/web/components/cancel-booking-button.tsx`, `apps/web/components/booking-completion-actions.tsx`, `apps/web/components/report-user-menu.tsx`: booking accept/decline/cancel/dispute handlers include actionable support messaging, but report submission still falls back to generic `"Could not submit report. Please try again."` without support contact.
14. **PARTIAL** — `apps/web/components/terms-acceptance-modal.tsx`, `apps/web/app/register/page.tsx`, `apps/web/lib/terms-acceptance.ts`, `apps/web/lib/session-lock.ts`, `packages/database/supabase/migrations/0033_input_validation_and_name_normalization.sql`: terms keys are persisted and cleared on sign-out, and steps gate on current user/session state; however, storage write occurs in `onAccept` flow after async user resolution, not strictly synchronous at button click.
15. **VERIFIED** — `apps/web/lib/validation/sanitize.ts`, `apps/web/lib/validation/blocked-words.ts`, `apps/web/lib/validations/register-nurse.ts`, `apps/web/lib/validations/profile.ts`, `apps/web/lib/validations/booking.ts`, `apps/web/app/api/messages/route.ts`: profanity utilities/files exist, list includes English + Filipino profanity, Zod refinements cover registration/profile/booking notes, and messages are checked server-side.
16. **PARTIAL** — `apps/web/lib/validation/phone.ts`, `apps/web/lib/validations/profile.ts`, `apps/web/app/register/page.tsx`, `apps/web/app/dashboard/family/profile/page.tsx`, `apps/web/app/dashboard/nurse/profile/page.tsx`: numeric `inputMode`/`maxLength=11` and `09` regex validation are present for provided values, but schema allows empty string (optional) rather than strict always-required 11-digit enforcement.
17. **VERIFIED** — `apps/web/lib/validation/format-name.ts`, `apps/web/app/register/page.tsx`, `apps/web/app/api/register/nurse/route.ts`, `apps/web/app/dashboard/family/profile/page.tsx`, `apps/web/app/dashboard/nurse/profile/page.tsx`, `packages/database/supabase/migrations/0033_input_validation_and_name_normalization.sql`: `toTitleCase` is applied before writes and migration normalizes existing profile names and `families.patient_name`.
18. **VERIFIED** — `apps/web/app/api/register/nurse/route.ts`, `apps/web/.env.example`: user-facing response does not expose service-role variable names, server logs keep technical detail, and `SUPABASE_SERVICE_ROLE_KEY` is documented.
19. **VERIFIED** — `apps/web/lib/legal/terms-content.tsx`, `apps/web/lib/legal/privacy-content.tsx`: duplicate in-document summary blocks are removed, requested policy/terms sections are present, and contact email usage is consistent (`support@hanapkalinga.com`).

## Details for PARTIAL / NOT FOUND

### Item 4 — Verification emails using Resend consistently (PARTIAL)
- **What is missing:** Requested use of `sendEmailSafe` in the verification route is not present.
- **Current state:** Route uses `sendEmail` directly (awaited), which works but differs from requested utility usage.
- **File to adjust:** `apps/web/app/api/admin/verification/route.ts`.

### Item 5 — Database types regenerated (PARTIAL)
- **What is missing:** Generated types do not include all newer schema columns (notably `profiles.terms_accepted_at`, suspension metadata fields).
- **Current state:** `apps/web/types/database.types.ts` includes many recent fields but is not fully in sync with latest migrations.
- **File to regenerate/check:** `apps/web/types/database.types.ts`.

### Item 6 — Block enforcement in browse and messaging (PARTIAL)
- **What is missing:** Browse-side block exclusion is scoped to family viewers.
- **Current state:** Messaging API and UI enforcement are implemented, but `/nurses` filtering only applies `user_blocks` when `viewerRole === "family"`.
- **File to adjust:** `apps/web/app/nurses/page.tsx`.

### Item 9 — Document upload route role check (PARTIAL)
- **What is missing:** Strict nurse-only authorization (`403` for non-nurse role) is not enforced.
- **Current state:** Route allows provider roles (`nurse` and `caregiver`) plus admins.
- **File to adjust:** `apps/web/app/api/upload/document/route.ts`.

### Item 13 — Booking and report error messages (PARTIAL)
- **What is missing:** Report submission fallback message is generic and lacks support contact guidance.
- **Current state:** Booking accept/decline/cancel/dispute handlers are actionable with support email, but report flow has a generic fallback.
- **File to adjust:** `apps/web/components/report-user-menu.tsx`.

### Item 14 — Terms checkbox persistence across steps (PARTIAL)
- **What is missing:** Strict synchronous sessionStorage write exactly at modal Continue click is not explicit.
- **Current state:** Storage is written in `handleTermsAccepted` after async auth resolution; step gating and sign-out clearing are implemented.
- **Files to adjust/check:** `apps/web/components/terms-acceptance-modal.tsx`, `apps/web/app/register/page.tsx`.

### Item 16 — Phone number validation (PARTIAL)
- **What is missing:** Strict always-required 11-digit enforcement is not present.
- **Current state:** Validation correctly normalizes digits and enforces `09\d{9}` when provided, but allows empty values.
- **Files to adjust/check:** `apps/web/lib/validation/phone.ts`, `apps/web/lib/validations/profile.ts`.

## Overall Verdict

**NEEDS ATTENTION** — one or more items are PARTIAL: **4, 5, 6, 9, 13, 14, 16**.

## Security Review Addendum (Booking/Chat/Suffix Sprint)

### Scope reviewed
- RLS policies across `packages/database/supabase/migrations/*.sql`.
- API handlers under `apps/web/app/api/**/route.ts`.
- Auth/middleware-related gate behavior already covered in prior audit.

### Findings implemented in this change set
- **RLS hardening added:** `packages/database/supabase/migrations/0035_security_hardening_policies.sql`
  - Tightened care-request visibility so open requests are readable by verified providers, owner family, or admin.
  - Added DB trigger guard for non-admin booking status transitions to prevent direct invalid updates.
- **API validation hardening:** `apps/web/app/api/user-blocks/route.ts`
  - Added Zod validation for `DELETE` query param (`blockedId` UUID).
- **Abuse-control hardening:** `apps/web/lib/rate-limit.ts`, `apps/web/app/api/messages/route.ts`, `apps/web/app/api/upload/document/route.ts`
  - Added lightweight per-user throttling for message send and document upload endpoints.

### Remaining known security gaps (not fully solved in this patch)
- **Profiles field-level exposure model:** existing `profiles` select policies still operate at row level, while the requirement asks for public-field-only access (`full_name`, `photo_url`, `city`) for other users and restricted visibility of fields like suspension metadata/terms acceptance.
  - Achieving strict field-level isolation likely requires a dedicated public profile view/RPC plus app query migration, not only policy tweaks.

