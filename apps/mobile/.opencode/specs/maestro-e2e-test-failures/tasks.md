# Implementation Plan: Maestro E2E Test Failures

## Overview

Five priority-ordered phases fix the 5 bug categories. Each phase includes the fix, the corresponding correctness property validation, and a checkpoint. Phase 0 (prerequisite) addresses the OTP bypass which unblocks all registration tests. Phases 1–3 fix the YAML assertion/ordering bugs. Phase 4 tackles the harder session persistence and nurse launch bugs.

## Tasks

### Phase 0: OTP Bypass for Local Development

- [ ] 1. **Disable email confirmation in local Supabase config**
  - Locate `supabase/config.toml` (likely at `D:\NurseLink\supabase\config.toml`)
  - Add or uncomment:
    ```toml
    [auth.email]
    enable_confirmations = false
    ```
  - Run `supabase start` to apply the config change
  - _Requirements: 2.4, 2.5_
  - **Success criteria:** A registration test OTP call succeeds without requiring actual email verification

- [ ] 2. **Checkpoint — OTP bypass verified**
  - Manually run `node scripts/seed-e2e.mjs` with `-Env local`
  - Verify seed creates users without OTP issues
  - Ask the user if any questions arise

### Phase 1: Fix Post-Login Assertions (C1)

- [ ] 3. **Fix `login-success.yaml`**
  - Change line 31 from `id: "browse_button_filter"` to `id: "familyDashboard_button_browse"`
  - _Requirements: 2.1_
  - **Success criteria:** YAML passes `maestro validate` or visual inspection confirms change

- [ ] 4. **Fix `session-restore.yaml`**
  - Change line 43 from `id: "browse_button_filter"` to `id: "familyDashboard_button_browse"`
  - _Requirements: 2.2_
  - **Success criteria:** Same as task 3

- [ ] 5. **Fix `register-family.yaml`**
  - Change line 111 from `id: "browse_button_filter"` to `id: "familyDashboard_button_browse"`
  - _Requirements: 2.3_
  - **Success criteria:** Same as task 3

- [ ] 6. **Checkpoint — C1 fixes verified**
  - Run `.\scripts\run-maestro.ps1 -Env local -SkipSeed -Flows "maestro/auth/login-success.yaml"` after seed
  - Verify `login-success.yaml` passes with family email (not just `login-success-family.yaml`)
  - Ask the user if any questions arise

### Phase 2: Fix Navigation Ordering (C4)

- [ ] 7. **Fix `family/browse-nurses.yaml`**
  - Move the `extendedWaitUntil visible id:"browse_button_filter"` block (lines 13–16) to **after** the `tapOn id:"tab_browse"` block (lines 18–20)
  - The corrected order:
    1. `runFlow helpers.yaml`
    2. `tapOn id:"tab_browse"`
    3. `extendedWaitUntil visible id:"browse_button_filter"`
    4. `extendedWaitUntil visible id:"browse_list_nurses"`
    5. `extendedWaitUntil visible id:"browse_input_search"`
    6. (the second `browse_button_filter` wait at line 36-39 is fine as-is)
  - _Requirements: 2.7_
  - **Success criteria:** YAML structure validates: navigation precedes screen-specific assertions

- [ ] 8. **Checkpoint — C4 fix verified**
  - Run `.\scripts\run-maestro.ps1 -Env local -SkipSeed -Flows "maestro/family/browse-nurses.yaml"`
  - Verify the browse-nurses flow passes (depends on C1 fix + Phase 0)
  - Ask the user if any questions arise

### Phase 3: Nurse Launch + Session Restore Debug (C3, C5)

- [ ] 9. **Diagnose nurse app launch failure**
  - Run the nurse shard directly with verbose output:
    ```powershell
    maestro test maestro/nurse --env APP_ID=host.exp.Exponent --env ENV=local --env TEST_EMAIL=e2e-test-nurse-...@example.com --env TEST_PASSWORD=TestPass123!
    ```
  - Check if the app crashes or redirects:
    - Look for crash logs via `adb logcat`
    - Check if `clearKeychain: true` is needed in `setup.yaml`'s `launchApp`
    - Verify nurse profile data completeness in `seed-e2e.mjs`
  - _Requirements: 2.8_
  - **Success criteria:** Nurse shard reaches landing screen with `landing_button_login` visible

- [ ] 10. **Fix nurse launch based on findings**
  - Implement the appropriate fix:
    - If crash: Fix missing/malformed nurse data in seed script
    - If stale session: Add `clearKeychain: true` to `setup.yaml`
    - If redirect loop: Add pre-launch `stopApp` + `clearState` to nurse shard
  - _Requirements: 2.8_
  - **Success criteria:** `maestro test maestro/nurse/accept-booking.yaml --env ...` reaches landing screen

- [ ] 11. **Diagnose session persistence (C3)**
  - Add logging to `AuthContext.tsx` around the `getSession()` call (lines 82–87):
    - Log T0: when `initialize()` starts
    - Log T1: when `getSession()` promise begins
    - Log T2: when either `getSession()` resolves or timeout fires
  - Run `session-restore.yaml` and check logs via `adb logcat`
  - _Requirements: 2.6_
  - **Success criteria:** Clear evidence of whether timeout races SecureStore or `getSession()` returns null

- [ ] 12. **Fix session persistence based on findings**
  - Likely fix: Remove or extend the 5-second `Promise.race` timeout (lines 83–85 of `AuthContext.tsx`)
  - Alternative fix: Add a loading screen guard that blocks navigation until `isLoading === false`
  - _Requirements: 2.6_
  - **Success criteria:** `session-restore.yaml` passes with session restored within 20 seconds

- [ ] 13. **Checkpoint — C3 + C5 fixes verified**
  - Run nurse shard: `.\scripts\run-maestro.ps1 -Env local -SkipSeed -Flows "maestro/nurse/"`
  - Run session-restore: `.\scripts\run-maestro.ps1 -Env local -SkipSeed -Flows "maestro/auth/session-restore.yaml"`
  - Pass `tsc --noEmit` and `jest`
  - Ask the user if any questions arise

### Phase 4: Full Regression + New Flow Coverage

- [ ] 14. **Add missing E2E flow coverage as needed**
  - Identify gaps exposed during the fix process:
    - Nurse login flow (`login-success-nurse.yaml`) — currently no dedicated test for nurse post-login state
    - Admin login flow — may be covered but verify
    - Booking state transition tests if missing
  - Create new YAML files following existing patterns in `maestro/auth/`, `maestro/family/`, `maestro/nurse/`
  - _Requirements: 2.1, 2.8_ (new flows as needed per scope)
  - **Success criteria:** Newly added E2E flows pass on local environment

- [ ] 15. **Run full E2E regression**
  ```powershell
  .\scripts\run-maestro.ps1 -Env local
  ```
  - Verify all 3 shards pass (auth+family, nurse, admin)
  - Document any remaining failures
  - _Requirements: all_
  - **Success criteria:** All shards report `[PASS]` in the summary

- [ ] 16. **Final validation**
  - Run `tsc --noEmit` — 0 errors
  - Run `jest` — all tests pass (existing 58/58 expectations)
  - Ask the user if any questions arise

## Notes

- **Phase 0 is blocking** — registration tests cannot pass until OTP bypass is configured
- **Phases 1–2 are safe YAML-only changes** — can be done without a running emulator
- **Phase 3 is the riskiest** — involves debugging async app behavior and may require multiple iterations
- **Phase 4** includes optional new flow creation
- Each phase has an explicit checkpoint to validate before proceeding
