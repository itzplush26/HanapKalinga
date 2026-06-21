# Bugfix Requirements Document

## Introduction

The Maestro E2E test suite has 5 missing/correct testIDs that cause tests to fail at setup or during execution, plus ~20 text-based selectors that make tests fragile. The goal is to fix all broken testIDs, add missing testIDs in source code, and harden all text-based selectors so the full regression suite can run reliably.

## Glossary

- **testID**: React Native `testID` prop used by Maestro to locate elements
- **Text-based selector**: Maestro `tapOn: text:` or `visible: text:` which matches visible label text (fragile across i18n/UI changes)
- **Shared flow**: Reusable `.yaml` sub-flows in `maestro/shared/` used by multiple test flows
- **Tab bar**: Bottom navigation tabs in the app (no testIDs currently)

## Bug Analysis

### Current Behavior (Defect)

#### Bug Category 1: Missing Source testIDs Referenced by Tests

1.1 WHEN `setup.yaml` runs after a previous session, THEN it looks for `tab_profile` which does not exist, causing the logout-on-startup logic to fail silently or hang

1.2 WHEN any flow runs `shared/logout-actions.yaml`, THEN `profile_button_logout` testID is not found on either profile screen, so the logout tap never lands

1.3 WHEN `logout-actions.yaml` attempts to confirm the logout alert, THEN `logout_button_confirm` testID does not exist (native Alert dialog has no custom testID)

1.4 WHEN `family/browse-nurses.yaml` runs, THEN `browse_input_search` is asserted visible but no such testID exists in the browse nurses screen

#### Bug Category 2: Wrong testID Pattern

2.1 WHEN `nurse/set-availability.yaml` taps `availability_toggle_mon_morning`, THEN the source generates `availability_toggle_<ISO_DATE>_morning` (e.g., `availability_toggle_2026-06-22_morning`), so the tap never lands

#### Bug Category 3: Fragile Text-Based Selectors

3.1 Tab navigation uses `text:` selectors ("Bookings", "Browse", "Messages", "Schedule", "Verifications tab") instead of testIDs — breaks on label changes

3.2 Registration flows use `text: "Continue"`, `text: "Next"` instead of testIDs

3.3 Nurse registration uses `text: "Hourly Rate (PHP)"`, `text: "Daily Rate (PHP)"` instead of testIDs

3.4 Booking request uses `text: "Wound Care"` (skills chip) and `text: "Booking Requested"` (success alert) instead of testIDs

3.5 Availability save waits for `notVisible: text: "Saving"` instead of checking a state-bound testID

### Expected Behavior (Correct)

#### Bug Category 1 — Missing Source testIDs

4.1 The tab bar SHALL expose `tab_profile`, `tab_bookings`, `tab_browse`, `tab_messages`, `tab_schedule`, `tab_verifications` testIDs

4.2 The sign-out button in both profile screens SHALL have `profile_button_logout` testID

4.3 Logout confirmation SHALL use a custom modal with `logout_button_confirm` testID, OR the test SHALL use text-based matching for the native Alert

4.4 The browse nurses screen SHALL have a `browse_input_search` testID, OR the assertion SHALL be removed

#### Bug Category 2 — Wrong testID Pattern

5.1 The test in `nurse/set-availability.yaml` SHALL use the correct date-based dynamic ID pattern matching the source, OR the source SHALL be changed to also produce abbreviated day-based IDs

#### Bug Category 3 — Fragile Selectors

6.1 Tab navigation SHALL use testID-based selectors (`tab_bookings`, etc.) instead of text

6.2 "Continue" button on choose-role screen SHALL have `chooseRole_button_continue` testID
6.3 "Next" button on profile screen SHALL have `profile_button_next` testID
6.4 Hourly/Daily rate inputs SHALL have `profileNurse_input_hourlyRate` / `profileNurse_input_dailyRate` testIDs
6.5 Skills chips SHALL have `bookingNew_chip_skill_${skill}` testID or the test SHALL use a different reliable selector
6.6 Booking success SHALL have a `bookingNew_text_success` testID or similar
6.7 Save button loading state SHALL use `notVisible: id: "availability_button_save"` combined with loading prop, not text

### Unchanged Behavior (Regression Prevention)

7.1 All existing testIDs that currently work SHALL remain unchanged
7.2 All existing test flows SHALL continue to pass after fixes
7.3 No new testIDs SHALL be added to screens/components not relevant to E2E tests
