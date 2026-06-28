# Maestro E2E Testing

End-to-end tests for the NurseLink mobile app using [Maestro](https://maestro.mobile.dev).

## Quick Start

### Prerequisites
- Android emulator or iOS simulator running
- App installed on device
- Maestro CLI installed: `curl -Ls "https://get.maestro.mobile.dev" | bash`

### Running Tests Locally

**Windows:**
```cmd
cd apps\mobile
scripts\test-maestro-local.bat auth
```

**Mac/Linux:**
```bash
cd apps/mobile
./scripts/test-maestro-local.sh auth
```

### Running Specific Test Suites

```bash
# Auth flows (login, register, forgot password)
maestro test maestro/auth/ --env APP_ID=com.hanapkalinga.mobile --env ENV=staging

# Nurse workflows
maestro test maestro/nurse/ --env APP_ID=com.hanapkalinga.mobile --env ENV=staging

# Family workflows  
maestro test maestro/family/ --env APP_ID=com.hanapkalinga.mobile --env ENV=staging

# Admin workflows
maestro test maestro/admin/ --env APP_ID=com.hanapkalinga.mobile --env ENV=staging
```

## Test Structure

```
maestro/
├── auth/              # Authentication flows
│   ├── login-success.yaml
│   ├── login-failure.yaml
│   ├── register-nurse.yaml
│   ├── register-family.yaml
│   ├── forgot-password.yaml
│   └── session-restore.yaml
├── nurse/             # Nurse-specific workflows
│   ├── bookings-list.yaml
│   ├── accept-booking.yaml
│   ├── decline-booking.yaml
│   ├── set-availability.yaml
│   └── messages.yaml
├── family/            # Family-specific workflows
│   ├── browse-nurses.yaml
│   ├── nurse-detail.yaml
│   ├── request-booking.yaml
│   ├── bookings-list.yaml
│   └── booking-detail.yaml
├── admin/             # Admin-specific workflows
│   ├── dashboard-metrics.yaml
│   ├── verification-queue.yaml
│   ├── verification-detail.yaml
│   ├── approve-verification.yaml
│   └── reject-verification.yaml
└── shared/            # Reusable flows and helpers
    ├── setup.yaml
    ├── teardown.yaml
    ├── logout-actions.yaml
    ├── navigate-to-tab.yaml
    ├── helpers.yaml
    └── clear-auth-state.yaml
```

## Environment Variables

### Required
- `APP_ID`: App package name (com.hanapkalinga.mobile)
- `ENV`: Environment (staging/local)
- `TEST_EMAIL`: Test user email
- `TEST_PASSWORD`: Test user password

### Optional
- `BOOKING_ID`: For booking-related tests
- `NURSE_ID`: For nurse-specific tests
- `VERIFICATION_ID`: For admin verification tests

## CI/CD Integration

Tests run automatically on:
- Pull requests touching mobile code
- Manual workflow dispatch

Workflow: `.github/workflows/maestro-e2e.yml`

### Sharding Strategy
Tests are split into 4 parallel jobs:
1. **auth**: Authentication flows
2. **nurse**: Nurse workflows
3. **family**: Family workflows
4. **admin**: Admin workflows

## Common Issues

### "Element not found: landing_button_login"
**Cause**: App taking too long to initialize
**Solution**: Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### "Session persists between tests"
**Cause**: SecureStore not cleared
**Solution**: Use `clear-auth-state.yaml` helper flow

### "Tests pass locally but fail on CI"
**Cause**: Different network/CPU performance
**Solution**: Increase timeouts, check screenshots in artifacts

## Best Practices

### 1. Always use setup flow
```yaml
- runFlow:
    file: ../shared/setup.yaml
```

### 2. Use generous timeouts for network operations
```yaml
- extendedWaitUntil:
    visible:
      id: "some_element"
    timeout: 15000  # 15 seconds minimum
```

### 3. Make taps optional when UI might vary
```yaml
- tapOn:
    id: "modal_close_button"
    optional: true
```

### 4. Wait for animations
```yaml
- waitForAnimationToEnd:
    timeout: 5000
```

### 5. Use descriptive test IDs
```tsx
<Button testID="profile_button_logout">Logout</Button>
```

## Test ID Conventions

Format: `{screen}_{element}_{action}`

Examples:
- `landing_button_login` - Login button on landing screen
- `login_input_email` - Email input on login screen  
- `profile_button_logout` - Logout button on profile screen
- `tab_browse` - Browse tab in navigation

## Debugging

### Run with console output
```bash
maestro test maestro/auth/login-success.yaml --debug-output
```

### View test recording
Recordings are saved to `~/.maestro/tests/` after each run

### Check screenshots
Failed tests save screenshots to artifacts directory

### Enable verbose logging
```bash
export MAESTRO_CLI_DEBUG=true
maestro test maestro/auth/
```

## Writing New Tests

1. Create YAML file in appropriate directory
2. Start with setup flow: `runFlow: ../shared/setup.yaml`
3. Add test steps with descriptive actions
4. Use `testID` for reliable element selection
5. Add assertions to verify behavior
6. End with optional teardown

Example:
```yaml
appId: ${APP_ID}
env:
  TEST_EMAIL: ${TEST_EMAIL}
  TEST_PASSWORD: ${TEST_PASSWORD}
---
- runFlow:
    file: ../shared/setup.yaml

- tapOn:
    id: "landing_button_login"

- tapOn:
    id: "login_input_email"
- inputText: ${TEST_EMAIL}

- tapOn:
    id: "login_input_password"  
- inputText: ${TEST_PASSWORD}

- tapOn:
    id: "login_button_submit"

- assertVisible:
    id: "browse_button_filter"
```

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/getting-started/introduction)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Test ID Guidelines](../docs/test-ids.md)
- [CI/CD Workflow](../../.github/workflows/maestro-e2e.yml)

## Support

Questions or issues? Check the troubleshooting guide or ask in #mobile-dev Slack channel.
