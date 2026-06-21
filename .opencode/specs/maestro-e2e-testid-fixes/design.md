# Design Document: Maestro E2E TestID Fixes

## Overview

Five critical testID-related defects prevent the Maestro E2E suite from executing: three missing source testIDs (`tab_profile`, `profile_button_logout`, `logout_button_confirm`), one missing input testID (`browse_input_search`), and one pattern mismatch (`availability_toggle`). Additionally, ~20 text-based selectors introduce flakiness. The fix strategy is to add the missing testIDs to source components and harden test YAML files with reliable selectors.

## Glossary

- **C1**: Bug condition where tests reference non-existent `tab_profile` testID
- **C2**: Bug condition where tests reference non-existent `profile_button_logout` testID
- **C3**: Bug condition where tests reference non-existent `logout_button_confirm` testID
- **C4**: Bug condition where tests reference non-existent `browse_input_search` testID
- **C5**: Bug condition where test uses `availability_toggle_mon_morning` but source generates `availability_toggle_<ISO_DATE>_<shift>`
- **C6**: Bug condition where fragile text-based selectors are used instead of testIDs

| Property | Definition |
|---|---|
| **P1** | `setup.yaml` can detect and dismiss previous sessions via tab bar logout |
| **P2** | Logout flow can navigate to profile, tap sign-out, and confirm |
| **P3** | Browse screen asserts search input presence |
| **P4** | Availability toggle can be tapped reliably |
| **P5** | All navigation and interaction uses testID-based selectors |
| **Preservation** | Existing testIDs and flows remain unchanged |

## Root Cause Analysis

### Root Cause 1: TabBar has no testIDs
- **File**: `src/components/navigation/TabBar.tsx`
- **Evidence**: Grep confirms zero `testID` attributes in the TabBar component. `accessibilityLabel` exists but is not usable by Maestro `id:` selectors.

### Root Cause 2: Profile screens have no testID on sign-out buttons
- **Files**: `app/(family)/profile.tsx:194-211`, `app/(nurse)/profile.tsx:373-390`
- **Evidence**: Both render `<Button variant="outline">Sign out</Button>` without a `testID` prop.

### Root Cause 3: Logout uses native Alert instead of custom modal
- **Files**: Same as RC2
- **Evidence**: `Alert.alert('Sign out', 'Are you sure...', [{text: 'Cancel'}, {text: 'Sign out'}])` — no custom view to attach testID to.

### Root Cause 4: Browse screen lacks search input testID
- **File**: `app/(public)/nurses/index.tsx`
- **Evidence**: The screen has `browse_button_filter`, `browse_list_nurses`, and `browse_card_nurse_${id}` but no search input at all (no `Search` component, only a `Search` icon in EmptyState).

### Root Cause 5: Availability toggle uses date string not day abbreviation
- **File**: `app/(nurse)/availability.tsx:217`
- **Evidence**: Source: `` testID={`availability_toggle_${dateStr}_${shift}`} `` where `dateStr = date.toISOString().split('T')[0]` (e.g., `2026-06-22`). Test expects `mon_morning`.

### Root Cause 6: Test creators used `text:` as a shortcut
- **Evidence**: Multiple tests across all roles use `tapOn: text:` or `visible: text:` for tabs, buttons, and inputs. No corresponding testIDs exist for these elements.

## Correctness Properties

### Property 1: Session Detection

- _For any_ test run where a previous auth session exists in SecureStore, `setup.yaml` SHALL detect it and log out successfully.
- **Validates: Requirements 4.1**

### Property 2: Logout Completeness

- _For any_ profile screen (family or nurse), the sign-out button SHALL be tappable via `profile_button_logout` testID and the confirmation dialog SHALL be dismissable.
- **Validates: Requirements 4.2, 4.3**

### Property 3: Browse Screen Assertion

- The browse nurses screen SHALL have a search input element with `browse_input_search` testID, OR the test assertion SHALL be removed.
- **Validates: Requirements 4.4**

### Property 4: Availability Toggle Reliability

- _For any_ shift and day combination, the availability toggle SHALL be tappable via a testID that matches between source and test.
- **Validates: Requirements 5.1**

### Property 5: Tab Navigation Reliability

- _For any_ tab press in any test, the selector SHALL use a `testID` and SHALL NOT use a `text:` match.
- **Validates: Requirements 6.1**

### Property 6: Registration Interaction Reliability

- _For any_ registration flow step (choose-role Continue, profile Next, rate inputs), the interaction SHALL use a `testID` and SHALL NOT use a `text:` match.
- **Validates: Requirements 6.2, 6.3, 6.4**

### Preservation: Existing Functionality

- _For any_ existing testID that currently works, its value and behavior SHALL remain unchanged.
- **Validates: Requirements 7.1, 7.2, 7.3**

## Fix Implementation

### Fix 1: Add testIDs to TabBar

**File**: `src/components/navigation/TabBar.tsx`

**Changes**:
1. Add `testID={`tab_${tab.name.toLowerCase()}`}` to each tab `TouchableOpacity` where `name` is the route name (e.g. `tab_browse`, `tab_bookings`, `tab_messages`, `tab_schedule`, `tab_verifications`, `tab_profile`)

### Fix 2: Add testID to sign-out buttons + replace Alert with custom modal

**Files**: `app/(family)/profile.tsx`, `app/(nurse)/profile.tsx`

**Changes**:
1. Add `testID="profile_button_logout"` to both "Sign out" `<Button>` components
2. Replace `Alert.alert()` with a custom confirmation modal (`ConfirmModal` or inline `Modal` with `testID="logout_button_confirm"` on the confirm button)

### Fix 3: Fix browse nurses screen

**File**: `app/(public)/nurses/index.tsx`

**Option A** (Recommended): Add a search input with `testID="browse_input_search"`
- Add a `TextInput` component below the header with search functionality, or
- Add it inside the `ScreenWrapper` with a testID

**Option B** (Minimal): Remove the `assertVisible: id: "browse_input_search"` from the test

### Fix 4: Fix availability toggle testID

**File**: `nurse/set-availability.yaml`

**Change**: Replace `availability_toggle_mon_morning` with a computed approach, e.g.:
- Use `scrollUntilVisible` + `tapOn` on a dynamic ID computed from the current week's Monday date
- OR change the source to also generate `availability_toggle_${dayAbbr}_${shift}` for Maestro compatibility

**Recommended**: Change the test to compute the correct date-based ID, since the source testID is semantically richer (includes exact date).

### Fix 5: Replace text-based selectors with testIDs

**Files affected**:
- `maestro/nurse/bookings-list.yaml` — `text: "Bookings"` => `id: "tab_bookings"`
- `maestro/nurse/accept-booking.yaml` — `text: "Bookings"` => `id: "tab_bookings"`
- `maestro/nurse/decline-booking.yaml` — `text: "Bookings"` => `id: "tab_bookings"`
- `maestro/nurse/set-availability.yaml` — `text: "Schedule"` => `id: "tab_schedule"`
- `maestro/nurse/messages.yaml` — `text: "Messages"` => `id: "tab_messages"`
- `maestro/family/browse-nurses.yaml` — `text: "Browse"` => `id: "tab_browse"`
- `maestro/family/nurse-detail.yaml` — `text: "Browse"` => `id: "tab_browse"`
- `maestro/family/request-booking.yaml` — `text: "Browse"` => `id: "tab_browse"`
- `maestro/family/bookings-list.yaml` — `text: "Bookings"` => `id: "tab_bookings"`
- `maestro/family/booking-detail.yaml` — `text: "Bookings"` => `id: "tab_bookings"`
- `maestro/admin/verification-queue.yaml` — `text: "Verifications tab"` => `id: "tab_verifications"`
- `maestro/admin/verification-detail.yaml` — `text: "Verifications tab"` => `id: "tab_verifications"`
- `maestro/admin/approve-verification.yaml` — `text: "Verifications tab"` => `id: "tab_verifications"`
- `maestro/admin/reject-verification.yaml` — `text: "Verifications tab"` => `id: "tab_verifications"`
- `maestro/auth/register-nurse.yaml` — add `testID="chooseRole_button_continue"` to Continue button, `testID="profile_button_next"` to Next, `testID="profileNurse_input_hourlyRate"` to hourly rate, `testID="profileNurse_input_dailyRate"` to daily rate
- `maestro/auth/register-family.yaml` — add `testID="chooseRole_button_continue"` to Continue button, `testID="profile_button_next"` to Next

### Fix 6: Harden remaining text selectors

**Source files**:
- `app/(auth)/register/choose-role.tsx` — add `testID="chooseRole_button_continue"` to Continue `<Button>`
- `app/(auth)/register/profile.tsx` — add `testID="profile_button_next"` to Next `<Button>`, add `testID="profileNurse_input_hourlyRate"` to hourly rate `<Input>`, add `testID="profileNurse_input_dailyRate"` to daily rate `<Input>`
- `app/(family)/bookings/new.tsx` — add `testID="bookingNew_chip_skill_${spec}"` (dynamic) to each specialization `Chip`, add `testID="bookingNew_text_success"` to success confirmation view

**Test files**:
- `maestro/family/request-booking.yaml` — replace `text: "Wound Care"` with `id: "bookingNew_chip_skill_Wound Care"`, replace `text: "Booking Requested"` with `id: "bookingNew_text_success"`
- `maestro/nurse/set-availability.yaml` — replace `notVisible: text: "Saving"` with `notVisible: id: "availability_button_save"`

## Error Handling

| Scenario | Impact | Mitigation |
|---|---|---|
| `setup.yaml` cannot find any tab | Flow assumes already on landing screen (no-op) | Graceful skip via `optional: true` |
| Logout modal not found | Teardown leaves session active | `optional: true` on confirm |
| Dynamic testID mismatch (availability) | Test step fails | Compute date dynamically in test |

## Testing Strategy

### Phase 1: Exploratory Bug Condition Checking

**Goal**: Demonstrate that bugs exist BEFORE fixes.

1. Run `full-regression.yaml` on unfixed code — confirm failures on:
   - `setup.yaml` at `tab_profile` detection
   - `logout-actions.yaml` at `profile_button_logout`
   - `browse-nurses.yaml` at `browse_input_search`
   - `set-availability.yaml` at `availability_toggle_mon_morning`

### Phase 2: Fix Checking

**Goal**: Verify all bug conditions are resolved.

1. Run full regression after each source change
2. Verify all testIDs resolve correctly

### Phase 3: Preservation Checking

**Goal**: No regressions in existing passing tests.

1. Run full regression suite
2. Compare pass/fail counts with baseline

### Property-Based Testing Applicability

**Assessment**: NOT APPLICABLE

**Rationale**: This is a UI testID fix — properties are about element presence and naming consistency, not algorithmic correctness. PBT offers no advantage here.

### Manual Verification

1. Launch app, navigate to each affected screen
2. Inspect element hierarchy via Maestro `maestro inspect`
3. Confirm all new testIDs appear in the hierarchy
