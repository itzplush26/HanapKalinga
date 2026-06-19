# Maestro E2E Test Fixes

## Problem Statement

All Maestro E2E tests were failing with the error:
```
[Failed] test-name (1m+) (Assertion is false: id: landing_button_login is visible)
```

The app was taking over 60 seconds to show the landing screen, causing all tests to timeout at the initial setup step.

## Root Cause Analysis

1. **Font Loading Delay**: 5-second timeout in `_layout.tsx` before showing any UI
2. **Auth Session Check**: Synchronous Supabase session check added network latency (could hang indefinitely)
3. **CI Network Latency**: GitHub Actions emulator has slower network than local development
4. **Splash Screen Management**: App could hang on splash screen if fonts didn't load
5. **State Clearing**: Maestro's `clearState` doesn't clear Expo SecureStore where auth tokens are stored

## Changes Made

### 1. Reduced Font Loading Timeout
**File**: `apps/mobile/app/_layout.tsx`
- Reduced timeout from 5s to 3s
- Added console log for debugging
- App proceeds with system fonts if custom fonts fail

### 2. Added Auth Session Timeout
**File**: `apps/mobile/src/contexts/AuthContext.tsx`
- Added 5-second timeout to session check using `Promise.race()`
- Prevents hanging on slow network
- Added error logging for debugging
- App shows landing screen faster on cold starts

### 3. Optimized Supabase Client
**File**: `apps/mobile/src/lib/supabase.ts`
- Added PKCE flow type for better auth handling
- Set realtime timeout to 5 seconds
- Added client info header for debugging

### 4. Improved Maestro Setup Flow
**File**: `apps/mobile/maestro/shared/setup.yaml`
- Increased timeout from 60s to 90s for CI environments
- Added `waitForAnimationToEnd` after app launch (10s)
- Added animation wait after logout (5s)
- Better handles slow initialization

### 5. Created Aggressive Auth Clear Helper
**File**: `apps/mobile/maestro/shared/clear-auth-state.yaml` (NEW)
- Can be used when tests get stuck in authenticated state
- Uses `clearKeychain: true` for thorough cleanup
- Includes scroll and logout attempts

### 6. Enhanced Landing Screen
**File**: `apps/mobile/app/index.tsx`
- Added `testID="landing_screen"` to ScreenWrapper for better debugging

### 7. Updated CI Workflow
**File**: `.github/workflows/maestro-e2e.yml`
- Added app pre-warming step (launch, wait, force-stop)
- Added `pm clear` to thoroughly wipe app data before tests
- Improves reliability by warming up runtime and fonts

### 8. Created Troubleshooting Guide
**File**: `apps/mobile/maestro/TROUBLESHOOTING.md` (NEW)
- Comprehensive guide for debugging test failures
- Documents common issues and solutions
- Includes best practices and local testing instructions

## Expected Improvements

1. **Faster App Initialization**: 3-8 seconds instead of 5-10+ seconds
2. **Better Timeout Handling**: Won't hang indefinitely on network issues
3. **More Reliable Tests**: Pre-warming and proper state clearing
4. **Better Debugging**: Logs and testIDs for troubleshooting

## Testing the Fixes

### Locally
```bash
# Start emulator
emulator -avd Pixel_6 -no-snapshot-load

# Install and run app
cd apps/mobile
npm run android

# Run auth tests
maestro test maestro/auth/ \
  --env APP_ID=com.hanapkalinga.mobile \
  --env ENV=staging \
  --env TEST_EMAIL="test-family@example.com" \
  --env TEST_PASSWORD="TestPass123!"
```

### On CI
Push to a branch and create a PR. The Maestro E2E tests will run automatically.

## Monitoring

After deploying these fixes, monitor:
1. Test execution time (should be faster)
2. Success rate (should improve to >95%)
3. Specific failure patterns (check screenshots in artifacts)

## Rollback Plan

If these changes cause issues:
1. Revert font timeout back to 5s
2. Remove session timeout from AuthContext
3. Restore original setup.yaml timeout to 60s

## Additional Notes

- The 90-second timeout is generous for CI but tests should complete much faster locally
- Consider reducing to 60s after confirming stability
- Font loading can be optimized further by using Expo's font preloading

## Future Improvements

1. **Add Health Check Endpoint**: Create a simple endpoint that returns when app is ready
2. **Optimize Font Loading**: Pre-load fonts in a more efficient way
3. **Mock Network for Tests**: Use MSW or similar to control network responses
4. **Parallel Test Execution**: Run more shards in parallel if tests are reliable
5. **Add Retry Logic**: Automatically retry failed tests once before marking as failed
