# Bugfix Requirements Document: Maestro E2E Test Failures

## Introduction

Five distinct bugs cause 12 of 16 Maestro E2E flows to fail on local Supabase. The auth+family shard reports 9 failures (3 auth + 5 family + cascade), and the nurse shard fails to launch entirely. Fixing these bugs will unblock the full E2E regression suite, enabling automated testing in CI/CD pipelines.

## Glossary

- **Bug Condition (C)**: A specific defect in a Maestro YAML flow or application code that triggers a test failure
- **Post-Login Assertion**: A Maestro `extendedWaitUntil` command that checks for a testID after successful authentication to confirm the correct screen loaded
- **Cascade Failure**: A downstream test failure caused by a preceding test leaving the app in an inconsistent state
- **Session Persistence**: The ability of the app to restore a user's authenticated session after the app process is killed and relaunched, without requiring re-login
- **OTP (One-Time Password)**: A 6-digit verification code sent by Supabase Auth during email-based registration
- **Seed Data**: Test accounts (family, nurse, admin) created in Supabase by `scripts/seed-e2e.mjs` before running E2E flows
- **Preservation**: Existing working E2E flows and application behavior that must remain unchanged after fixes

## Bug Analysis

### Current Behavior (Defect)

#### Bug Category C1: Wrong Post-Login Screen Assertion

1.1 WHEN `login-success.yaml` logs in as a family user AND asserts `browse_button_filter` is visible, THEN the assertion times out because the family user lands on the Home dashboard (`/(family)`) which contains `familyDashboard_button_browse`, not the Browse screen.

1.2 WHEN `session-restore.yaml` restores a family user's session AND asserts `browse_button_filter` is visible, THEN the assertion times out for the same reason as 1.1.

1.3 WHEN `register-family.yaml` completes registration AND asserts `browse_button_filter` is visible, THEN the assertion times out for the same reason as 1.1.

#### Bug Category C2: Hardcoded OTP Does Not Match Random Supabase OTP

2.1 WHEN `register-family.yaml` enters OTP digits "000000" AND `supabase.auth.verifyOtp()` validates against the real OTP sent by Supabase Auth, THEN verification fails because the real OTP is randomly generated and does not match "000000".

2.2 WHEN `register-nurse.yaml` enters OTP digits "000000" under the same conditions, THEN verification fails for the same reason as 2.1.

#### Bug Category C3: Session Not Restored on Cold Start

3.1 WHEN `session-restore.yaml` kills the app via `stopApp` AND relaunches with `clearState: false` AND waits for the login button to NOT be visible, THEN the login button remains visible because the app fails to restore the session from SecureStore on cold start.

#### Bug Category C4: Browse Filter Asserted Before Navigation

4.1 WHEN `family/browse-nurses.yaml` waits for `browse_button_filter` to be visible AND the user is still on the Home tab (not the Browse tab), THEN the assertion times out because `browse_button_filter` only exists on the Browse screen.

#### Bug Category C5: Nurse App Launch Failure

5.1 WHEN the nurse shard runs `setup.yaml` AND waits for `landing_button_login` to be visible, THEN the element is not found within 90 seconds, indicating the app either crashes on launch or auto-redirects past the landing screen when using the nurse test account.

### Expected Behavior (Correct)

#### Bug Category C1: Role-Appropriate Post-Login Assertions

2.1 WHEN `login-success.yaml` logs in as a family user, THE system SHALL assert `familyDashboard_button_browse` is visible (matching `login-success-family.yaml`).

2.2 WHEN `session-restore.yaml` restores a family user's session, THE system SHALL assert `familyDashboard_button_browse` is visible.

2.3 WHEN `register-family.yaml` completes registration for a family user, THE system SHALL assert `familyDashboard_button_browse` is visible.

#### Bug Category C2: Bypass or Match OTP for Local Development

2.4 WHEN a registration test runs against local Supabase, THE system SHALL either auto-confirm the user's email via the Supabase Admin API before OTP entry, OR disable email confirmation in the local Supabase configuration.

2.5 WHEN registration tests enter the OTP, THE system SHALL successfully verify regardless of whether the OTP is "000000" or the actual OTP sent.

#### Bug Category C3: Session Persistence on Cold Start

2.6 WHEN the app is killed and relaunched, THE system SHALL restore the authenticated session within 20 seconds without showing the login screen.

#### Bug Category C4: Navigation Before Assertion

2.7 WHEN `family/browse-nurses.yaml` navigates to the Browse tab, THE system SHALL assert `browse_button_filter` is visible only AFTER tapping `tab_browse`, not before.

#### Bug Category C5: Nurse App Launch

2.8 WHEN the nurse shard starts, THE system SHALL either show the landing screen with `landing_button_login` visible within 90 seconds, OR the test SHALL handle the auto-redirect gracefully.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `login-success-family.yaml` runs, THE system SHALL CONTINUE TO assert `familyDashboard_button_browse` with the same pass/fail behavior.

3.2 WHEN `forgot-password.yaml` runs, THE system SHALL CONTINUE TO pass without changes.

3.3 WHEN `login-failure.yaml` runs, THE system SHALL CONTINUE TO pass without changes.

3.4 WHEN `login-success.yaml` logs in as a nurse user (via separate shard), THE system SHALL CONTINUE TO use a nurse-appropriate post-login assertion.

## Scope

### In-Scope
- Fixing the post-login assertion in `login-success.yaml`, `session-restore.yaml`, and `register-family.yaml`
- Implementing OTP bypass or auto-confirmation for local Supabase development
- Debugging and fixing session persistence on cold start (`AuthContext.tsx`)
- Fixing the navigation ordering bug in `family/browse-nurses.yaml`
- Debugging nurse app launch failure
- Adding new E2E test flows as needed to cover missing scenarios exposed during the fix process
- Updating the `run-maestro.ps1` orchestration script if needed

### Out-of-Scope
- Refactoring the Supabase client or auth library
- Performance optimization of the app startup
- CI/CD pipeline configuration (local development only)
