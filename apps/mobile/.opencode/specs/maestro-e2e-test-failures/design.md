# Design Document: Maestro E2E Test Failures

## Overview

Five distinct bugs cause 12 of 16 Maestro E2E flows to fail. The root causes span incorrect YAML assertions (wrong testID, wrong ordering), a local development environment gap (OTP not matchable), an application-level bug (session persistence), and a startup race condition (nurse app launch). The fix strategy addresses each category independently — YAML fixes are low-risk edits, the OTP issue requires a Supabase config change or seed-script enhancement, and the session/nurse bugs require application code changes with targeted testing.

## Glossary

- **Bug Condition (C1–C5)**: Formal defect categories defined in the requirements document
- **Post-Login Assertion**: A Maestro `extendedWaitUntil` that checks for a role-specific dashboard testID after authentication
- **Cascade Failure**: Downstream test failure caused by a preceding test failing
- **Admin API**: Supabase's service-role API that bypasses RLS and can auto-confirm users
- **SecureStore**: `expo-secure-store` — the encrypted storage used by Supabase to persist auth sessions

## Bug Details

### Bug C1: Wrong Post-Login Screen Assertion

**Formal Specification:**
```
FUNCTION familyLoginLandingScreen(role):
  INPUT: role ∈ {family, nurse, admin}
  OUTPUT: testID of expected landing screen element
  
  IF role = family THEN RETURN "familyDashboard_button_browse"
  IF role = nurse THEN RETURN <nurse_dashboard_element>
  IF role = admin THEN RETURN <admin_dashboard_element>
END FUNCTION
```

**Triggering Flows:**
- `login-success.yaml:29-32` — asserts `browse_button_filter` after family login
- `session-restore.yaml:41-43` — asserts `browse_button_filter` after family session restore
- `register-family.yaml:109-111` — asserts `browse_button_filter` after family registration

**Root Cause:** The original `login-success.yaml` was written before role-based sharding existed. When `full-regression.yaml` ran all flows with one email, it was implicitly testing a single role. After sharding, the family email is used, but the assertion was never updated to match the family dashboard's actual testID.

### Bug C2: Hardcoded OTP Does Not Match Random Supabase OTP

**Formal Specification:**
```
FUNCTION supabaseVerifyOtp(email, token):
  INPUT: email (string), token (6-digit string)
  OUTPUT: { success: boolean, error?: string }
  
  // Supabase Auth generates a random token on signInWithOtp(email)
  // verifyOtp succeeds ONLY IF token === generatedToken
  RETURN supabase.auth.verifyOtp({ email, token, type: 'email' })
END FUNCTION
```

**Triggering Flows:**
- `register-family.yaml:27-56` — enters `OTP_DIGIT_0="0"` through `OTP_DIGIT_5="0"` → sends `"000000"`
- `register-nurse.yaml:29-58` — same pattern → sends `"000000"`

**Root Cause:** In production, the 6-digit OTP is sent via email. In local Supabase development, `supabase start` generates random OTPs by default. The YAML files hardcode `000000` based on an assumption that local Supabase uses a fixed OTP — but this is not the default behavior. Configuring `enable_confirmations = false` in `config.toml` bypasses this by auto-confirming email addresses.

### Bug C3: Session Not Restored on Cold Start

**Formal Specification:**
```
FUNCTION sessionRestore():
  FLOW:
    1. supabase.auth.signIn({ email, password }) → session
    2. stopApp()
    3. launchApp(clearState: false)
    4. supabase.auth.getSession()
    
  EXPECTED: getSession() returns the session from step 1
  ACTUAL:   getSession() returns null → app shows login screen
END FUNCTION
```

**Triggering Flow:** `session-restore.yaml`

**Hypothesized Root Cause:** In `AuthContext.tsx:79-101`, `getSession()` is wrapped in a `Promise.race` with a 5-second timeout:

```typescript
const sessionPromise = client.auth.getSession();
const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 5000));
const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
```

If SecureStore initialization (which happens asynchronously during Expo app startup) is slow on a cold start — perhaps due to font loading, splash screen, or the `react-native-url-polyfill` setup — the `getSession()` call may not resolve within 5 seconds, causing the timeout to fire with `null`. The auth state then initializes as unauthenticated, and the UI renders the landing screen before the actual session response arrives.

**Alternative Hypothesis:** The Supabase JS client's session persistence may require the `persistSession: true` option (default) AND the `react-native-async-storage` adapter to be properly initialized. If the Expo Router navigation is configured to redirect before the auth state is fully hydrated, the app may render the landing screen before the session is restored.

### Bug C4: Browse Filter Asserted Before Navigation

**Formal Specification:**
```
FUNCTION browseNursesFlow():
  SEQUENCE:
    1. runFlow(helpers.yaml)         // logs in
    2. waitForVisible(browse_button_filter)  ← BUG: user is on Home tab
    3. tapOn(tab_browse)             // navigates to Browse tab
    4. waitForVisible(browse_list_nurses)
    
  EXPECTED: step 2 succeeds because browse_button_filter is visible
  ACTUAL:   step 2 times out because user is on Home tab, not Browse tab
END FUNCTION
```

**Triggering Flow:** `family/browse-nurses.yaml:13-20`

**Root Cause:** Simple editing error — the `extendedWaitUntil` for `browse_button_filter` was placed before the `tapOn` `tab_browse`. The intent was clearly to navigate first, then assert the browse screen elements.

### Bug C5: Nurse App Launch Failure

**Formal Specification:**
```
FUNCTION nurseShardSetup():
  FLOW:
    1. clearState: true
    2. launchApp
    3. waitForVisible(landing_button_login, timeout: 90000)
    
  EXPECTED: landing_button_login is visible within 90s
  ACTUAL:   landing_button_login never appears
END FUNCTION
```

**Hypothesized Root Cause:** The nurse test account created by `seed-e2e.mjs` may have incomplete profile data that causes a crash during initial data fetch, or a stale auth session exists from a previous seed run that redirects the app past the landing screen into a broken dashboard state. The `clearState: true` in `setup.yaml` should clear the app data, but `clearKeychain` may not be set, leaving SecureStore intact.

## Correctness Properties

### Property P1: Post-Login Assertion Correctness (Validates C1)

*For any* role-based login flow, the post-login assertion SHALL check the testID corresponding to the logged-in role's landing screen.

**Formalization:**
```
PROPERTY: For all flows F in {login-success, session-restore, register-family}:
           F's post-login assertion ID SHALL match familyLoginLandingScreen(family)
           
Current violation: login-success.yaml asserts "browse_button_filter"
                   Expected: "familyDashboard_button_browse"
```

**Validates: Requirements 2.1, 2.2, 2.3**

### Property P2: Registration OTP Bypass (Validates C2)

*For any* registration flow running against local Supabase, the system SHALL NOT require a real OTP email exchange; the user SHALL be auto-confirmed or the OTP SHALL be deterministic.

**Formalization:**
```
PROPERTY: For local ENV only:
           supabase.auth.verifyOtp(email, "000000") SHALL succeed
           OR
           supabase.auth.admin.createUser() SHALL be called with email_confirm: true
```

**Validates: Requirements 2.4, 2.5**

### Property P3: Session Persistence (Validates C3)

*For any* authenticated session, after `stopApp()` and `launchApp(clearState: false)`, `supabase.auth.getSession()` SHALL return the session within 20 seconds.

**Formalization:**
```
PROPERTY: For all valid sessions S:
           after app restart without clearState:
           ∃t ∈ [0, 20000]: getSession().data.session.user.id = S.user.id
```

**Validates: Requirement 2.6**

### Property P4: Navigation Ordering (Validates C4)

*For any* flow that navigates to a screen before asserting elements on that screen, the navigation command SHALL precede the element assertion.

**Formalization:**
```
PROPERTY: In browse-nurses.yaml:
           ORDER(tapOn(tab_browse)) < ORDER(waitForVisible(browse_button_filter))
```

**Validates: Requirement 2.7**

### Property P5: Nurse App Launch (Validates C5)

*For any* nurse test account, the app SHALL either show the landing screen within 90 seconds, OR the setup flow SHALL handle auto-redirect gracefully.

**Formalization:**
```
PROPERTY: setup.yaml with nurse email SHALL result in either:
           (a) landing_button_login visible within 90000ms, OR
           (b) a controlled redirect that does not crash
```

**Validates: Requirement 2.8**

### Property P6: Preservation — Existing Auth Flows (Validates Regression Prevention)

*For any* input that does NOT trigger C1–C5 conditions, the existing flows SHALL produce exactly the same behavior as before the fixes.

**Formalization:**
```
PROPERTY: For all flows F not modified by this fix:
           outcome(F) AFTER fix = outcome(F) BEFORE fix
           
Coverage: forgot-password, login-failure, login-success-family
```

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Fix 1: Correct Post-Login Assertions

**Files:**
- `maestro/auth/login-success.yaml`
- `maestro/auth/session-restore.yaml`
- `maestro/auth/register-family.yaml`

**Changes:**
1. In `login-success.yaml:28-32`: Replace `id: "browse_button_filter"` with `id: "familyDashboard_button_browse"`
2. In `session-restore.yaml:41-43`: Replace `id: "browse_button_filter"` with `id: "familyDashboard_button_browse"`
3. In `register-family.yaml:109-111`: Replace `id: "browse_button_filter"` with `id: "familyDashboard_button_browse"`

### Fix 2: OTP Bypass for Local Development

**Option A (Recommended — Supabase Config):**
- **File:** `supabase/config.toml` (in `D:\NurseLink` — subproject root)
- **Change:** Add `enable_confirmations = false` under `[auth.email]` section

This tells local Supabase to auto-confirm email addresses, meaning `supabase.auth.signInWithOtp()` will immediately confirm the user without requiring OTP entry.

**Option B (Alternative — Admin API):**
- **File:** `scripts/seed-e2e.mjs` or new helper script
- **Change:** After calling `signInWithOtp()`, use `supabase.auth.admin.updateUserById()` to set `email_confirmed_at` to now

**Option C (Alternative — Dynamic OTP Fetch):**
- **File:** New `scripts/fetch-otp.mjs`
- **Change:** Query the local Supabase inbucket API (`http://127.0.0.1:54324`) to extract the actual OTP from the email, then pass it to Maestro via env var

### Fix 3: Session Persistence

**File:** `src/contexts/AuthContext.tsx`

**Hypothesized changes needed:**
1. Remove or extend the 5-second `Promise.race` timeout on `getSession()` — replace with a longer timeout (15-20s) or remove it entirely
2. Ensure `supabase.auth.onAuthStateChange` fires with `SIGNED_IN` event on cold start if session exists
3. Add a loading guard: render a splash/loading screen until the auth initialization completes (set `isLoading` to `true` until `getSession()` resolves)
4. Verify that the app's root layout (`app/_layout.tsx`) waits for `useAuth().isLoading === false` before rendering any navigation

### Fix 4: Navigation Ordering

**File:** `family/browse-nurses.yaml`

**Change:** Move the `extendedWaitUntil` for `browse_button_filter` from before `tapOn tab_browse` to after it. The corrected order:
1. `runFlow helpers.yaml`
2. `tapOn id:"tab_browse"`  ← navigation first
3. `extendedWaitUntil visible id:"browse_button_filter"`  ← then assert

### Fix 5: Nurse App Launch

**Changes needed (depends on debug findings):**
1. If crash → fix nurse profile data creation in `seed-e2e.mjs`
2. If stale session → add `clearKeychain: true` to `setup.yaml`'s `launchApp`
3. If redirect loop → add `stopApp` + `clearState` before `launchApp` in the nurse shard

## Testing Strategy

### Phase 1: Exploratory Bug Condition Checking

**Goal:** Surface counterexamples that demonstrate each bug before implementing the fix.

| Bug | Test | Expected Failure |
|-----|------|------------------|
| C1 | Run `login-success.yaml` with family email | ❌ Assertion: `browse_button_filter` not visible |
| C2 | Run `register-family.yaml` with fresh email | ❌ OTP verification fails, `chooseRole_button_family` never appears |
| C3 | Run `session-restore.yaml` after successful login | ❌ Login screen visible after relaunch |
| C4 | Run `family/browse-nurses.yaml` after fixing C1 | ❌ `browse_button_filter` assertion times out before tab navigation |
| C5 | Run nurse shard with `maestro test maestro/nurse` | ❌ `landing_button_login` times out |

### Phase 2: Fix Checking

**Goal:** Verify that for each bug condition, the fixed system produces the expected behavior.

1. **Fix C1**: After assertion change → `login-success.yaml` passes with family email
2. **Fix C2**: After config change → registration flows skip OTP or auto-confirm
3. **Fix C3**: After AuthContext fix → session restored within 20s
4. **Fix C4**: After reordering → `family/browse-nurses.yaml` passes
5. **Fix C5**: After debug fix → nurse flows reach landing screen

### Phase 3: Preservation Checking

**Goal:** Verify that existing working flows are not broken.

1. Run `login-success-family.yaml` — confirms family dashboard assertion still works
2. Run `forgot-password.yaml` — confirms unmodified auth flow still passes
3. Run `login-failure.yaml` — confirms error handling flow still passes
4. Run `tsc --noEmit` — confirms no TypeScript regressions
5. Run `jest` — confirms unit test regressions

### Property-Based Testing Applicability

**Assessment:** NOT APPLICABLE

**Rationale:** The bugs in this spec are in Maestro YAML test flows and a React Native application's auth initialization code. PBT is well-suited for testing pure functions with well-defined input spaces (e.g., sorting algorithms, validation logic). The bugs here are:
- Static YAML configuration errors (wrong testID, wrong statement order)
- Environment configuration mismatches (local Supabase OTP behavior)
- Asynchronous timing races (session restore timeout)

None of these involve pure functions with algebraic properties that PBT can exploit. The fixes are validated through deterministic E2E execution, not through randomized input generation.
