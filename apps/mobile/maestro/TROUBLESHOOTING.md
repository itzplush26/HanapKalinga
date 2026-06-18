# Maestro E2E Test Troubleshooting Guide

## Common Issues and Solutions

### Issue: Tests fail with "Element not found: landing_button_login"

**Root Causes:**
1. App takes too long to initialize (fonts, auth session check)
2. Splash screen doesn't hide properly
3. Network latency on CI/CD environment
4. Persisted auth state not clearing between tests

**Solutions Implemented:**

#### 1. Reduced Font Loading Timeout (3s instead of 5s)
- Location: `apps/mobile/app/_layout.tsx`
- The app now proceeds faster if fonts don't load immediately
- System fonts are used as fallback

#### 2. Added Auth Session Timeout (5s)
- Location: `apps/mobile/src/contexts/AuthContext.tsx`
- Prevents hanging on slow Supabase session checks
- App shows landing screen faster on cold starts

#### 3. Increased Maestro Setup Timeout (90s)
- Location: `apps/mobile/maestro/shared/setup.yaml`
- Accommodates slower CI environments
- Added `waitForAnimationToEnd` to prevent premature interactions

#### 4. App Pre-warming in CI
- Location: `.github/workflows/maestro-e2e.yml`
- Launches app once before tests to warm up the runtime
- Clears app data to ensure clean state

#### 5. Added Supabase Client Optimizations
- Location: `apps/mobile/src/lib/supabase.ts`
- Set reasonable timeouts for network requests
- Prevents hanging on network issues

### Issue: Tests pass locally but fail on CI

**Common Causes:**
- CI emulators have slower CPU/network than local devices
- Font loading failures
- Network timeout issues

**Debugging Steps:**

1. Check screenshots in artifacts:
   ```
   artifacts/[run-id]/maestro-screenshots-[shard]/
   ```

2. Enable verbose Maestro logging:
   ```bash
   export MAESTRO_CLI_DEBUG=true
   maestro test apps/mobile/maestro/auth/
   ```

3. Run locally with similar constraints:
   ```bash
   # Throttle network to simulate CI
   adb shell settings put global airplane_mode_on 1
   adb shell am broadcast -a android.intent.action.AIRPLANE_MODE
   ```

### Issue: Session persists between tests

**Solution:**
The `clearState: true` in Maestro doesn't clear Expo SecureStore. We now:
1. Clear state in Maestro setup
2. Add explicit logout flow if user is detected
3. Use `pm clear` in CI to wipe all app data

### Test Best Practices

1. **Always use setup.yaml:**
   ```yaml
   - runFlow:
       file: ../shared/setup.yaml
   ```

2. **Use extended timeouts for CI:**
   ```yaml
   - extendedWaitUntil:
       visible:
         id: "some_element"
       timeout: 15000  # minimum 15s for network operations
   ```

3. **Add optional taps for conditional UI:**
   ```yaml
   - tapOn:
       id: "modal_close_button"
       optional: true
   ```

4. **Wait for animations to complete:**
   ```yaml
   - waitForAnimationToEnd:
       timeout: 5000
   ```

### Running Tests Locally

```bash
# Start emulator
emulator -avd Pixel_6 -no-snapshot-load

# Install app
npm run android

# Run specific test suite
maestro test apps/mobile/maestro/auth/ \
  --env APP_ID=com.hanapkalinga.mobile \
  --env ENV=staging \
  --env TEST_EMAIL="test@example.com" \
  --env TEST_PASSWORD="TestPass123!"

# Run all tests
maestro test apps/mobile/maestro/ \
  --env APP_ID=com.hanapkalinga.mobile \
  --env ENV=staging
```

### Emulator Setup

```bash
# Create emulator (one-time)
avdmanager create avd -n Pixel_6 \
  -k "system-images;android-34;google_apis;x86_64" \
  -d pixel_6

# Start with recommended settings
emulator -avd Pixel_6 \
  -no-snapshot-load \
  -no-boot-anim \
  -gpu swiftshader_indirect
```

### Environment Variables

Required for all tests:
- `APP_ID`: Package name (com.hanapkalinga.mobile)
- `ENV`: Environment (staging/local)
- `TEST_EMAIL`: Test user email
- `TEST_PASSWORD`: Test user password

Optional (for specific flows):
- `BOOKING_ID`: For booking-related tests
- `NURSE_ID`: For nurse-specific tests  
- `VERIFICATION_ID`: For admin verification tests

## Performance Optimization Tips

1. **Use AVD snapshots** (local development):
   - Speeds up emulator cold starts
   - Disabled in CI for consistency

2. **Pre-warm the app** (CI):
   - Launch once before tests
   - Initializes runtime, loads fonts

3. **Disable animations** (CI):
   - Reduces wait times
   - More deterministic behavior

4. **Use smaller timeouts locally**, larger on CI:
   - Local: 5-10s waits
   - CI: 15-30s waits

## Known Limitations

1. **clearState doesn't clear SecureStore**
   - Workaround: Explicit logout flow in setup.yaml

2. **Font loading is asynchronous**
   - Workaround: Timeout fallback to system fonts

3. **Network latency varies**
   - Workaround: Generous timeouts + error handling

4. **Emulator performance varies**
   - Workaround: Pre-warming and caching

## Getting Help

If tests still fail after following this guide:

1. Collect artifacts from failed run
2. Check screenshots to see actual app state
3. Enable debug logging
4. Compare local vs CI behavior
5. Review recent code changes that might affect startup time
