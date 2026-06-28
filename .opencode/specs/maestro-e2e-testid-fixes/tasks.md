# Implementation Plan: Maestro E2E TestID Fixes

## Overview

Three-phase implementation: (1) add missing source testIDs for the 5 critical blockers, (2) harden ~20 text-based selectors, (3) final validation with full regression run. Each phase ends with a checkpoint requiring test passes before proceeding.

## Tasks

### Phase 1: Fix Critical Blocker testIDs

- [ ] 1. Add testIDs to TabBar component
  - Edit `src/components/navigation/TabBar.tsx`
  - Add `testID={tab_${routeName}}` to each tab `TouchableOpacity` (e.g. `tab_browse`, `tab_bookings`, `tab_messages`, `tab_schedule`, `tab_verifications`, `tab_profile`)
  - _Requirements: 4.1_

- [ ] 2. Add testID to sign-out button + replace Alert with custom modal
  - Edit `app/(family)/profile.tsx` — add `testID="profile_button_logout"` to sign-out `<Button>`, replace `Alert.alert()` with a custom Modal or confirm dialog that has `testID="logout_button_confirm"` on the confirm action
  - Edit `app/(nurse)/profile.tsx` — same changes
  - _Requirements: 4.2, 4.3_

- [ ] 3. Add search input to browse nurses screen OR remove assertion
  - Edit `app/(public)/nurses/index.tsx` — add a `TextInput` with `testID="browse_input_search"` above the nurses list, OR
  - Edit `maestro/family/browse-nurses.yaml` — remove the `assertVisible: id: "browse_input_search"` block (lines 29-32)
  - **Recommended**: Add the search input (maintains test coverage intent)
  - _Requirements: 4.4_

- [ ] 4. Fix availability toggle testID pattern
  - Edit `nurse/set-availability.yaml` — replace `availability_toggle_mon_morning` with a computed ID matching the source pattern `availability_toggle_${dateStr}_${shift}`
  - Use Maestro environment variable or dynamic reference to compute Monday's ISO date
  - _Requirements: 5.1_

- [ ] 5. Checkpoint — Phase 1
  - Run `maestro test maestro/auth/login-success.yaml` (tests setup.yaml + basic flow)
  - Run `maestro test maestro/shared/logout-actions.yaml` (tests tab + logout)
  - Run `maestro test maestro/family/browse-nurses.yaml` (tests browse screen)
  - Run `maestro test maestro/nurse/set-availability.yaml` (tests availability)
  - **ALL 4 MUST PASS** before proceeding

### Phase 2: Harden Text-Based Selectors

- [ ] 6. Replace tab text selectors with testIDs across all tests
  - **Nurse tests**: `nurse/bookings-list.yaml`, `nurse/accept-booking.yaml`, `nurse/decline-booking.yaml`, `nurse/messages.yaml`
  - **Family tests**: `family/browse-nurses.yaml`, `family/nurse-detail.yaml`, `family/request-booking.yaml`, `family/bookings-list.yaml`, `family/booking-detail.yaml`
  - **Admin tests**: `admin/verification-queue.yaml`, `admin/verification-detail.yaml`, `admin/approve-verification.yaml`, `admin/reject-verification.yaml`
  - Replace each `tapOn: text: "TabName"` with `tapOn: id: "tab_tabname"`
  - Fix `text: "Verifications tab"` => `id: "tab_verifications"` in all 4 admin tests
  - _Requirements: 6.1_

- [ ] 7. Add testIDs to registration elements + update tests
  - Edit `app/(auth)/register/choose-role.tsx` — add `testID="chooseRole_button_continue"` to Continue `<Button>`
  - Edit `app/(auth)/register/profile.tsx` — add `testID="profile_button_next"` to Next `<Button>`, add `testID="profileNurse_input_hourlyRate"` to hourly rate Input, add `testID="profileNurse_input_dailyRate"` to daily rate Input
  - Edit `maestro/auth/register-nurse.yaml` — replace `text: "Continue"` => `id: "chooseRole_button_continue"`, `text: "Next"` => `id: "profile_button_next"`, `text: "Hourly Rate (PHP)"` => `id: "profileNurse_input_hourlyRate"`, `text: "Daily Rate (PHP)"` => `id: "profileNurse_input_dailyRate"`
  - Edit `maestro/auth/register-family.yaml` — same replacements for Continue and Next
  - _Requirements: 6.2, 6.3, 6.4_

- [ ] 8. Harden booking request text selectors
  - Edit `app/(family)/bookings/new.tsx` — add testID `bookingNew_chip_skill_${spec}` (dynamic) to each specialization `Chip` in the skills section
  - Add testID `bookingNew_text_success` to the success confirmation alert/view
  - Edit `maestro/family/request-booking.yaml` — replace `text: "Wound Care"` => `id: "bookingNew_chip_skill_Wound Care"`, replace `text: "Booking Requested"` => `id: "bookingNew_text_success"`
  - _Requirements: 6.5, 6.6_

- [ ] 9. Harden availability save loading check
  - Edit `maestro/nurse/set-availability.yaml` — replace `notVisible: text: "Saving"` with `notVisible: id: "availability_button_save"` (or wait for the button to be re-enabled via state)
  - _Requirements: 6.7_

- [ ] 10. Checkpoint — Phase 2
  - Run `maestro test maestro/auth/register-nurse.yaml`
  - Run `maestro test maestro/auth/register-family.yaml`
  - Run `maestro test maestro/family/request-booking.yaml`
  - **ALL 3 MUST PASS** before proceeding

### Phase 3: Final Validation

- [ ] 11. Run full regression suite
  - Execute `maestro test maestro/config.yaml` (discovers all flows in `auth/`, `family/`, `nurse/`, `admin/`)
  - Execute `smoke-test.yaml`
  - Verify ALL flows pass
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 12. Run unit tests to check no regressions
  - `cd D:\NurseLink\apps\mobile && npx jest __tests__/`
  - Verify all unit tests still pass
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 13. Checkpoint — Phase 3 Complete
  - All E2E flows pass
  - All unit tests pass
  - Confirm no regressions introduced
  - Ask user for final sign-off

## Notes

- Tasks are ordered by dependency: critical blockers first, then hardening, then validation
- Each phase includes a checkpoint to catch issues early
- `*` No optional tasks — all are required for a reliable suite
