# Implementation Plan: Mobile E2E Testing with Maestro

## Overview

Implementation is organized into 5 phases: foundational setup, test ID annotation, flow authoring, CI integration, and validation. Each phase builds on the previous, with explicit checkpoints to verify correctness before moving forward.

## Tasks

### Phase 1: Maestro Infrastructure & Test ID Foundation

- [ ] 1. Install and configure Maestro CLI in the project
  - Add `.maestro/` to project root with `version: 1.x` config
  - Create `apps/mobile/maestro/config.yaml` with flow paths and env defaults
  - Create `apps/mobile/maestro/.env.maestro` with environment variable templates
  - Verify `maestro --version` works locally
  - _Requirements: 1.1, 1.4_

- [ ] 2. Create seed data scripts
  - Write `scripts/seed-e2e.mjs` — creates test accounts (family, nurse, nurse-pending, admin) via Supabase Admin API
  - Write `scripts/cleanup-e2e.mjs` — deletes `e2e-test-%` records
  - Write `scripts/run-maestro.sh` (or `.ps1`) — orchestrates: seed → launch app → run flows → cleanup
  - Verify scripts run successfully against local Supabase
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 3. Create shared Maestro helper flows
  - `shared/setup.yaml` — launches app, waits for splash, navigates to landing
  - `shared/teardown.yaml` — closes app
  - `shared/helpers.yaml` — reusable subflows: `loginAs`, `logout`, `navigateToTab`
  - _Requirements: 1.1, 1.2_

- [ ] 4. Checkpoint — Infrastructure Validation
  - Run `maestro test shared/setup.yaml` and verify the app launches on iOS Simulator
  - Run `maestro test shared/setup.yaml` and verify the app launches on Android Emulator
  - Run seed and cleanup scripts end-to-end
  - Verify flows are discovered by `maestro test --help`
  - **Success criteria**: App launches on both platforms, seed data populates and cleans up

### Phase 2: Test ID Annotation

- [ ] 5. Audit existing components and screens for missing `testID` props
  - Scan all screen files under `app/` and component files under `src/components/`
  - Create a mapping of required `testID` values vs. existing
  - _Requirements: 1.5_

- [ ] 6. Annotate Auth screens with `testID` props
  - Landing: `landing_button_login`, `landing_button_register`
  - Login: `login_input_email`, `login_input_password`, `login_button_submit`, `login_link_forgotPassword`, `login_text_error`
  - Register: `register_input_email`, `register_button_sendOtp`, `verifyOtp_input_0`..`verifyOtp_input_5`, `verifyOtp_button_verify`, `chooseRole_button_family`, `chooseRole_button_nurse`, `profileFamily_input_name`, `profileNurse_input_name`, `setPassword_input_password`, `setPassword_button_submit`
  - Forgot/Reset: `forgotPassword_input_email`, `forgotPassword_button_submit`, `updatePassword_input_password`, `updatePassword_button_submit`
  - _Requirements: 2, 3_

- [ ] 7. Annotate Family screens with `testID` props
  - Browse: `browse_input_search`, `browse_button_filter`, `browse_list_nurses`, `browse_card_nurse_{id}`
  - Nurse Detail: `nurseDetail_text_name`, `nurseDetail_button_requestBooking`, `nurseDetail_text_rate`
  - New Booking: `bookingNew_picker_date`, `bookingNew_picker_shift`, `bookingNew_input_condition`, `bookingNew_input_budget`, `bookingNew_button_submit`
  - Family Bookings List: `familyBookings_list_bookings`, `familyBookings_card_{id}`
  - Booking Detail: `bookingDetail_text_status`, `bookingDetail_button_message`, `bookingDetail_button_review`
  - _Requirements: 4_

- [ ] 8. Annotate Nurse screens with `testID` props
  - Availability: `availability_grid_monday`, `availability_toggle_monday_morning`, `availability_button_save`
  - Nurse Bookings List: `nurseBookings_list_bookings`, `nurseBookings_card_{id}`
  - Nurse Booking Detail: `nurseBookingDetail_button_accept`, `nurseBookingDetail_button_decline`
  - Messages: `messages_list_conversations`, `messages_card_{id}`
  - _Requirements: 5_

- [ ] 9. Annotate Admin screens with `testID` props
  - Dashboard: `dashboard_metrics_pendingVerifications`, `dashboard_metrics_totalBookings`
  - Verifications Queue: `verificationQueue_filter_all`, `verificationQueue_filter_pending`, `verificationQueue_list_requests`, `verificationQueue_card_{id}`
  - Verification Detail: `verificationDetail_text_name`, `verificationDetail_button_approve`, `verificationDetail_button_reject`, `verificationDetail_text_auditLog`
  - _Requirements: 6_

- [ ] 10. Checkpoint — Test ID Coverage
  - Run TypeScript compilation to ensure no breakage from `testID` additions
  - Run existing Jest tests to confirm no regressions
  - **Success criteria**: All screens compile, all existing tests pass, no TypeScript errors

### Phase 3: Maestro Flow Authoring

- [ ] 11. Write Auth Maestro flows
  - `auth/register-family.yaml`
  - `auth/register-nurse.yaml`
  - `auth/login-success.yaml`
  - `auth/login-failure.yaml`
  - `auth/forgot-password.yaml`
  - `auth/session-restore.yaml`
  - _Requirements: 2, 3_

- [ ] 12. Write Family Maestro flows
  - `family/browse-nurses.yaml`
  - `family/nurse-detail.yaml`
  - `family/request-booking.yaml`
  - `family/bookings-list.yaml`
  - `family/booking-detail.yaml`
  - _Requirements: 4_

- [ ] 13. Write Nurse Maestro flows
  - `nurse/set-availability.yaml`
  - `nurse/accept-booking.yaml`
  - `nurse/decline-booking.yaml`
  - `nurse/bookings-list.yaml`
  - `nurse/messages.yaml`
  - _Requirements: 5_

- [ ] 14. Write Admin Maestro flows
  - `admin/dashboard-metrics.yaml`
  - `admin/verification-queue.yaml`
  - `admin/verification-detail.yaml`
  - `admin/approve-verification.yaml`
  - `admin/reject-verification.yaml`
  - _Requirements: 6_

- [ ] 15. Write full-regression suite
  - `full-regression.yaml` — orchestrates all flows sequentially with environment checkpoints
  - _Requirements: 7_

- [ ] 16. Checkpoint — Flow Authoring Complete
  - Run each flow individually on iOS Simulator against local dev
  - Run each flow individually on Android Emulator against local dev
  - Run `full-regression.yaml` end-to-end on both platforms
  - **Success criteria**: Every flow passes on both platforms, full regression completes in under 30 min

### Phase 4: CI/CD Integration

- [ ] 17. Create GitHub Actions workflow for Maestro E2E tests
  - Create `.github/workflows/maestro-e2e.yml`
  - Configure matrix strategy for Android (iOS not yet supported in GitHub Actions runners)
  - Steps: checkout → setup Node → install dependencies → build Expo APK → start emulator → run seed → run Maestro flows → upload screenshots on failure → run cleanup
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 18. Add staging environment configuration
  - Add staging `APP_ID` and `SUPABASE_URL` variables as GitHub Actions secrets
  - Support manual workflow dispatch with `environment` input (local/staging)
  - _Requirements: 7.4_

- [ ] 19. Checkpoint — CI Validation
  - Push branch and open a draft PR
  - Verify CI pipeline triggers and completes
  - Verify failed flows upload screenshots as artifacts
  - Verify passing flows report success
  - **Success criteria**: CI pipeline passes on PR, failure artifacts are accessible

### Phase 5: Documentation & Polish

- [ ] 20. Write developer documentation
  - Update `apps/mobile/AGENTS.md` with Maestro setup and running instructions
  - Add "Running E2E Tests" section to README or QUICK_START
  - Document environment variable configuration
  - _Requirements: 1.2, 1.3, 1.5_

- [ ] 21. Final validation run
  - Run full regression suite on iOS Simulator (local)
  - Run full regression suite on Android Emulator (local)
  - Trigger CI run targeting staging environment
  - **Success criteria**: All 20+ flows pass on both platforms locally, CI passes on staging

## Notes

- Tasks marked with `*` are optional and can be skipped for MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- `testID` annotation (Phase 2) is the highest-risk, most labor-intensive phase — prioritize screens in order: auth → family → nurse → admin
