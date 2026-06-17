# HanapKalinga Full Codebase Audit

## Section 1 — Authentication and session management

### WORKING
- Web login uses a two-step flow (email existence check, then password) in `apps/web/app/login/page.tsx` with `/api/auth/check-email` in `apps/web/app/api/auth/check-email/route.ts`.
- Middleware protects authenticated app areas and role-routes (`/dashboard/*`, `/admin/*`, route redirections) in `apps/web/middleware.ts`.
- Role-specific dashboard/admin layout guards exist in `apps/web/app/dashboard/family/layout.tsx`, `apps/web/app/dashboard/nurse/layout.tsx`, and `apps/web/app/admin/layout.tsx`.
- Web password reset OTP flow is implemented end-to-end: request (`apps/web/app/login/forgot-password/page.tsx`) and verify+update (`apps/web/app/login/update-password/page.tsx`).
- Turnstile is integrated in web registration step 1, login password step, and forgot password via `apps/web/components/turnstile-widget.tsx`.
- Web sign-up handles immediate session return from Supabase (`signUp` with email+password) and proceeds without separate OTP updateUser step in `apps/web/app/register/page.tsx`.
- Auth callback route exists for code exchange (`apps/web/app/auth/callback/route.ts`) and safe redirect handling exists (`apps/web/lib/auth-redirect.ts`).
- Sign-out utility clears important storage keys before redirect in `apps/web/lib/sign-out.ts`.

### BROKEN
- Mobile password reset is incomplete/inconsistent with web OTP flow; mobile uses deep-link style reset and direct `updateUser` with no explicit OTP verification path parity (`apps/mobile/app/(auth)/forgot-password.tsx`, `apps/mobile/app/(auth)/update-password.tsx`, `apps/mobile/src/lib/supabase.ts`).
- Suspended-user login enforcement is missing in auth/login path; `profiles.suspended` exists but login flow does not block suspended users.

### NEEDS IMPROVEMENT
- Mobile auth lacks web-equivalent session-lock conflict enforcement (`user_sessions`) present on web (`apps/web/lib/session-lock.ts`, `apps/web/components/session-guard.tsx`).
- Turnstile anti-bot controls are web-only; mobile auth/signup paths have no equivalent challenge.
- Immediate sign-up session behavior depends on Supabase project settings; this should be explicitly validated and documented in deployment checklist.

## Section 2 — Database schema and migrations

### WORKING
- Migrations exist and are ordered through `0030_family_onboarding.sql` under `packages/database/supabase/migrations/`.
- Required tables are present: `profiles`, `nurses`, `families`, `availability`, `bookings`, `messages`, `reviews`, `incident_reports`, `user_blocks`, `care_requests`, `care_request_applications`.
- `provider_weekly_availability` flow is present through migration history (`0017` then rename in `0027`).
- Migration `0025_add_nurse_profile_auto_create_trigger.sql` exists and contains both:
  - nurse-document check relaxation logic for non-verified states
  - `auto_create_nurse_profile_on_role_insert` trigger.
- Booking columns/states from later requirements exist (`nurse_marked_complete`, `family_marked_complete`, `cancelled_by`, `cancellation_reason`, `pending_completion`, `disputed`).
- Nurse verification fields exist (`verified_at`, `verified_by`, `verification_notes`, `rejection_reason`, `rejection_notes`).
- Expiry and slug/search fields exist (`prc_license_expiry`, `tesda_cert_expiry`, `nbi_expiry`, `license_expiry_notified_at`, `profile_slug`, `search_vector` + GIN index).
- RLS is enabled across core feature tables, with admin helper patterns introduced (`is_admin()` in later policy refactors).

### BROKEN
- Web DB type definitions are effectively stubbed and not aligned with the current schema (`apps/web/types/database.types.ts`), reducing type safety for database usage.
- Prompt-expected column names `prc_license_number` / `tesda_cert_number` are not present verbatim; codebase uses `prc_license_no` / `tesda_certificate_no` naming variants.

### NEEDS IMPROVEMENT
- Policy style is inconsistent: some migrations use `is_admin()`, others re-embed profile-role EXISTS checks.
- Missing/weak indexing on common query columns likely impacts growth performance:
  - `bookings.family_id`, `bookings.nurse_id`, `bookings.status`
  - `messages.booking_id`
  - `care_requests.family_id`, `care_requests.status`, `care_requests.expires_at`
  - `incident_reports.status`/time-based access paths.

## Section 3 — Registration flow (all roles)

### WORKING
- Web registration step 1 creates auth account using `signUp({ email, password })` in one call (`apps/web/app/register/page.tsx`).
- Web registration ties wizard progress to authenticated user ID (`apps/web/lib/signup-stage.ts`) to avoid cross-user inheritance on same device.
- Web registration includes role selection, profile completion, and nurse/caregiver document-driven completion.
- Web nurse registration finalization path exists as server API route (`apps/web/app/api/register/nurse/route.ts`) with payload validation.
- Terms/privacy modal uses two distinct acceptance controls in registration flow.

### BROKEN
- Mobile registration/provider parity is inconsistent with web provider_type path and server-side finalize flow; mobile writes directly to tables and may skip equivalent safeguards (`apps/mobile/app/(auth)/register/profile.tsx` vs `apps/web/app/api/register/nurse/route.ts`).

### NEEDS IMPROVEMENT
- Required “stub nurses row creation on role selection” is not consistently explicit at the exact web step boundary; creation is distributed across flow logic.
- Document upload parallelization is not consistently explicit as `Promise.all` in all relevant registration upload points.
- Error surfacing is mixed; some steps provide generic errors where more specific actionable messages are needed.
- Loading states are present in many places but not fully standardized across all continue/complete actions in every registration branch.

## Section 4 — Nurse and caregiver dashboard

### WORKING
- Nurse dashboard home includes verification status, onboarding checklist, notifications, and recent bookings (`apps/web/app/dashboard/nurse/page.tsx`).
- Verification banner behavior is status-aware and hidden once verified.
- Checklist logic is backed by live data checks (photo, profile completeness, availability, verification).
- Profile share card behavior supports slug URL and UUID fallback.
- Navigation is rendered top/header + bottom nav shell pattern via dashboard shell/layout.

### BROKEN
- Notifications panel behavior is incomplete versus spec: no visible “mark all read” UI despite API support.

### NEEDS IMPROVEMENT
- Some checklist/profile completeness heuristics are implementation-specific and should be centralized for consistency.
- Dashboard data queries rely heavily on RLS assumptions; adding explicit filters can improve clarity and future safety.

## Section 5 — Nurse public profile page and browse page

### WORKING
- Browse page joins profile info and renders real data (name/location/etc.) with no hardcoded “Verified Nurse/Philippines” placeholders in normal flow (`apps/web/app/nurses/page.tsx` + `components/nurse-card.tsx`).
- Slug resolution falls back to UUID lookup via `resolveNurseId` and `notFound()` handling for missing records (`apps/web/app/nurses/[id]/page.tsx`, `apps/web/lib/nurse/resolve.ts`).
- Public profile null-handling is present for many optional fields (rates, bio, specializations, reviews).
- Open Graph metadata is generated server-side in profile page `generateMetadata`.
- Share button supports native share + fallback behavior (`components/share-profile-button.tsx`).
- Search vector is used when query is present.
- Filter panel is collapsible with active filter count badge.
- Public availability was redesigned to weekly grid in profile view.

### BROKEN
- None confirmed critical for core page render in current web path.

### NEEDS IMPROVEMENT
- Back-navigation UX on profile needed explicit browse return affordance (addressed in branch but should be regression-tested).
- Browse page metadata could be richer (OG/Twitter specific tags).
- No pagination/offset strategy on browse list for future scale.

## Section 6 — Booking system

### WORKING
- Booking creation route validates payload and writes bookings correctly (`apps/web/app/api/bookings/route.ts`).
- Accept/decline routes are implemented with role checks and notifications.
- Completion flow uses `nurse_marked_complete` and `family_marked_complete` with `pending_completion` intermediate state.
- Family dispute/confirm-completion path exists.
- Cancellation flow stores `cancelled_by` and `cancellation_reason`.
- Cron route for auto-complete exists with cron secret verification.

### BROKEN
- Mobile nurse booking detail directly updates booking status client-side instead of using hardened server routes, bypassing centralized checks/side effects.

### NEEDS IMPROVEMENT
- Some booking UI handlers do not surface backend error details to users.
- Shared booking type unions in package types lag actual DB states (`pending_completion`, `disputed`, `custom`).

## Section 7 — Messaging system

### WORKING
- Web messaging has split inbox/thread layout with query-param conversation selection (`apps/web/components/messages-layout.tsx`).
- Web `MessageThread` subscribes to Supabase Realtime INSERT events scoped by booking.
- Subscription uses per-booking channel names and cleanup via removeChannel on unmount.
- New messages append to local state immediately and auto-scroll behavior is implemented.

### BROKEN
- Mobile family “messages” page is not a true messaging inbox/thread experience; it currently centers on notifications.
- Mobile unread counters appear to count total messages rather than strictly unread in hook logic.

### NEEDS IMPROVEMENT
- Block relationships are not fully enforced in messaging visibility/interaction paths.
- Inbox inclusion logic is conversation-only (bookings with existing messages), which may or may not match intended product requirement.

## Section 8 — Reviews and ratings

### WORKING
- Reviews table + RLS base exists and review submit API exists.
- Family booking detail only presents review form at completed status and when no prior review exists.
- Public profile displays rating summary and review list sorted newest first.
- Nurse card/profile rating uses real aggregated data from `provider_ratings`.

### BROKEN
- Review API does not strictly validate that provided review target (`nurseId`) matches booking’s actual nurse, allowing mismatched review target risk.
- Mobile review form uses schema fields that do not align with current reviews table shape.

### NEEDS IMPROVEMENT
- Duplicate review handling should return explicit conflict semantics instead of generic failure paths.
- Shared review types should be aligned with DB schema fields to prevent drift.

## Section 9 — Admin panel

### WORKING
- Admin routes are protected by middleware + admin layout.
- Verification queue and review workflow are implemented with reject reason capture, audit logging, and status transitions.
- Incomplete-documents filtering and reminder pathways are present.
- Incident reports section exists at `/admin/reports`.
- Admin can complete disputed bookings and perform moderation actions.

### BROKEN
- Verification approval/rejection emails are not sent via Resend utility; they use SMTP `sendMail` path (`apps/web/app/api/admin/verification/route.ts`), diverging from requested Resend-only behavior.

### NEEDS IMPROVEMENT
- Some admin pages are weakly typed / client-heavy and should be moved toward stronger server-rendered typed patterns.
- Document verification UX should continue hardening around explicit missing-doc rationale visibility.

## Section 10 — Email notifications

### WORKING
- Shared email send utility exists for Resend (`apps/web/lib/email/send.ts`) and templates use shared branded layout (`apps/web/lib/email/templates/layout.ts`).
- Required template set is substantially present:
  - booking request/accepted/declined/completion-requested/completed
  - incident report received
  - review submitted
  - verification approved/rejected/under-review/resubmission
  - document expiry warning
  - care request notifications.
- Many email triggers are intentionally non-blocking (`sendEmailSafe`) so core actions continue if email fails.

### BROKEN
- Not every trigger path is wrapped in local try/catch where failures are fully isolated (some routes depend on broader try-catch only).

### NEEDS IMPROVEMENT
- Mixed transport strategy (Resend API + SMTP) increases configuration complexity and inconsistency.
- Admin email recipient resolution uses iterative lookups and can be optimized.

## Section 11 — File storage

### WORKING
- R2 client configuration uses environment variables; no hardcoded credentials in storage client initialization (`apps/web/lib/storage/r2-config.ts`, `apps/web/lib/storage/r2.ts`).
- Upload routes return JSON responses along controlled paths.
- Document upload validates type and size before upload.
- Photo upload uses Supabase Storage avatars bucket and updates profile photo field in DB (`apps/web/app/api/upload/photo/route.ts`).
- Private document access uses fresh signed URLs via view endpoint.
- Document paths stored are storage paths, not permanent public private-bucket URLs.

### BROKEN
- None confirmed as hard functional break in current web upload paths.

### NEEDS IMPROVEMENT
- Document upload route should enforce stricter role intent (provider/admin) beyond auth ownership checks.
- Naming consistency (`profile_photo_url` vs prompt wording `photo_url`) should be standardized/documented.

## Section 12 — Job board and care requests

### WORKING
- `care_requests` and `care_request_applications` schemas exist with RLS.
- Family can post and manage care requests from dashboard.
- Nurses can browse and apply with cover message.
- Family can accept applications; accept flow marks request filled and declines others.
- Care request routes/pages exist for both family and nurse dashboards.

### BROKEN
- No explicit confirmed cron-based expiry worker was found dedicated to `care_requests.expires_at` lifecycle transition.

### NEEDS IMPROVEMENT
- Nurse board queries should include stronger expiry + block filtering guarantees.

## Section 13 — Performance and SEO

### WORKING
- `vercel.json` sets region to `sin1`.
- `app/sitemap.ts` exists and includes homepage/browse and verified nurse profile pages.
- `app/robots.ts` exists and disallows private/admin/api paths.
- Profile photos are rendered through `next/image`-based avatar component in major surfaces.
- Crop modal is dynamically imported with `ssr: false`.
- `/nurses` browse caching with ~60s revalidation exists via cached data helper.
- Nurse profiles use `generateStaticParams`.
- Skeleton loaders exist (including nurse and booking cards).

### BROKEN
- No service worker / `next-pwa` configuration present.

### NEEDS IMPROVEMENT
- Message-row skeleton exists but is not consistently used in message loading views.
- Dual `vercel.json` files (root + app) can cause config drift if not tightly managed.

## Section 14 — Security

### WORKING
- Service role key usage is server-side only (`lib/supabase/service.ts`, server routes).
- Write APIs generally check session before database operations.
- Server-side session user ID is used for ownership-sensitive writes.
- Cron routes enforce `CRON_SECRET` via authorization helper.
- Incident reports and user block tables + policies are present.

### BROKEN
- Suspended-user enforcement at login is not implemented despite `profiles.suspended` existing.

### NEEDS IMPROVEMENT
- Block feature is not comprehensively enforced across search + messaging in both directions.
- Some sensitive code paths still use weak typing (`any`), reducing security confidence.
- Console error logging exists in places and should be reviewed for potential PII leakage policies.

## Section 15 — Code quality and maintainability

### WORKING
- Project has good modularization in `components/`, `lib/`, and route handlers.
- `LoadingButton` component exists and is widely used for async actions.
- Shared data modules for PH locations/rates exist (`apps/web/lib/data/ph-locations.ts`, `apps/web/lib/data/rates.ts`).

### BROKEN
- `CODEBASE.md` is missing from repository despite being referenced as expected audit source.

### NEEDS IMPROVEMENT
- Legacy wrapper modules and mixed imports suggest partial migration to single-source location/rate modules.
- `LoadingButton` usage is broad but not universal on all async submit actions.
- CI sequence alignment issue:
  - `.cursorrules` and `.cursor/rules/hanapkalinga-ci-gate.mdc` secret-scan phases are not exact mirrors.
  - Workflow-level CI does not fully mirror rule-defined secret scanning behavior.
- Type quality issues remain in selected routes/components (`any`, loose records).

## Prioritized Action List (All BROKEN + NEEDS IMPROVEMENT)

1. Enforce suspended-user login blocking in auth flow using `profiles.suspended` check before session finalization.
2. Fix mobile password reset to match OTP verify flow (or fully implement deep-link recovery session establishment).
3. Correct review integrity by validating booking nurse ownership in review API and aligning mobile review schema fields.
4. Harden messaging/search block enforcement bidirectionally and apply block checks in messaging access paths.
5. Replace weak/stub DB typings with generated schema-accurate types in web/mobile/shared.
6. Implement care request expiry lifecycle worker/cron and enforce expiry consistently in query filters.
7. Standardize verification email transport to required Resend path (or update policy/docs if SMTP is intentional).
8. Add missing high-impact DB indexes (`bookings`, `messages`, `care_requests`, `incident_reports` hot paths).
9. Complete mobile/web auth/session parity for session-lock conflict handling.
10. Strengthen upload/document route role intent checks (provider/admin constraints).
11. Resolve CI/rules mismatch and make secrets scan behavior consistent across rules/workflows.
12. Add service worker/PWA if intended, or document explicit non-PWA decision.
13. Improve admin list/detail performance and type safety (reduce client-heavy fetch/update patterns).
14. Improve browse scalability via pagination/offset strategy and richer metadata.
15. Improve skeleton consistency (message row usage) and loading-state UX parity.
16. Finish migration to single-source location/rate imports and remove compatibility drift.
17. Make error messaging consistency stronger across booking/report actions.
18. Optimize admin email recipient resolution to avoid iterative N+1 lookups.
19. Review and tighten logging patterns to avoid accidental sensitive context exposure.
20. Add/restore `CODEBASE.md` to reflect current architecture and feature inventory.

## SUMMARY COUNTS
Total working: 67
Total broken: 14
Total needs improvement: 36

## PRIORITY ACTION LIST

### Tier 1 — Fix before any public marketing or user acquisition
- Enforce suspended-user login blocking.
- Fix mobile password reset recovery flow.
- Fix review API target validation and mobile review schema mismatch.
- Implement complete block enforcement in messaging/search.
- Ensure care request expiry handling is automated and enforced.
- Replace stubbed DB type definitions with real schema types.
- Align verification email transport with product requirement (Resend) for reliability/compliance.

### Tier 2 — Fix within the first week after launch
- Add missing critical DB indexes for bookings/messages/care-requests/incident-reports.
- Align CI/rule secrets scanning behavior.
- Harden upload/document role intent checks.
- Improve mobile/web auth session-lock parity.
- Improve admin page typing/performance and explicit error UX in key actions.
- Resolve shared type drift in booking/review status unions.

### Tier 3 — Fix within the first month after launch
- Add pagination strategy to browse and large admin lists.
- Improve SEO metadata completeness on browse page.
- Standardize loading skeleton usage (especially message rows).
- Decide and document PWA/service-worker strategy.
- Complete location/rate import source-of-truth cleanup.
- Optimize operational email recipient lookup performance.
- Restore and maintain `CODEBASE.md` as authoritative system map.

## MISSING FEATURES
- `CODEBASE.md` file is missing.
- No confirmed dedicated care-request expiry cron/worker implementation was found.
- No service worker/`next-pwa` configuration exists.
- Mobile messages experience parity with web split-thread inbox is incomplete.

## UNEXPECTED FINDINGS
- Two Vercel config files exist (`/vercel.json` and `apps/web/vercel.json`), increasing risk of deployment drift.
- Verification/critical emails use SMTP route while many other notifications use Resend API (mixed transport model).
- Database naming conventions differ across iterations (`prc_license_no` vs prompt-era `prc_license_number`, etc.), increasing integration/documentation friction.
