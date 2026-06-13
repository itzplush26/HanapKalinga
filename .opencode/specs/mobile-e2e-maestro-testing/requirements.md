# Requirements Document: Mobile E2E Testing with Maestro

## Introduction

Add comprehensive end-to-end (E2E) testing for the NurseLink Expo React Native mobile app using Maestro, a cross-platform mobile E2E testing framework. These tests will validate critical user flows across all three roles (family, nurse, admin) on both iOS and Android, ensuring that core functionality works correctly from the user's perspective before deployment.

## Glossary

- **Maestro**: Cross-platform mobile E2E testing framework using YAML-based flow files
- **Flow**: A single Maestro test file (`.yaml`) describing a sequence of user interactions and assertions
- **E2E Test**: An end-to-end test that exercises the complete system (app, backend, database) like a real user
- **Test Suite**: A collection of Maestro flows organized by domain/role
- **CI/CD**: Continuous Integration / Continuous Deployment pipeline
- **Local Dev**: Running tests against a local Expo dev server with local Supabase
- **Staging**: Running tests against a deployed staging environment
- **MaaS**: Maestro as a Service (cloud-based Maestro runner)
- **Test ID**: A `testID` prop on React Native components used by Maestro for element selection
- **Seed Data**: Pre-defined database state required for tests to run deterministically

## Requirements

### Requirement 1: Maestro Infrastructure Setup

**User Story:** As a developer, I want Maestro configured for the mobile project so that E2E tests can be authored and run locally and in CI.

#### Acceptance Criteria

1. WHEN a developer runs `maestro test` on the project, THEN Maestro SHALL execute the configured flows
2. WHEN running locally, THE developer SHALL be able to target either iOS simulator or Android emulator
3. WHEN running in CI, THE flows SHALL be parameterizable to target staging with environment-specific configuration
4. WHEN a flow file is created under `apps/mobile/maestro/`, Maestro SHALL discover and run it
5. THE Maestro CLI version SHALL be pinned in project documentation

### Requirement 2: Registration Flow E2E Tests

**User Story:** As a new user, I want to complete the full registration process so that I can create an account as a family or nurse.

#### Acceptance Criteria

1. WHEN a new user enters a valid email, THEN the system SHALL send an OTP and navigate to OTP verification
2. WHEN the user enters a valid 6-digit OTP, THEN the system SHALL navigate to role selection
3. WHEN the user selects "Family" and completes the profile form, THEN the system SHALL create the profile and redirect to the family dashboard
4. WHEN the user selects "Nurse" and completes the profile form (including document upload), THEN the system SHALL create the profile and redirect to the nurse dashboard
5. WHEN the user sets a password, THEN the system SHALL persist the credential and allow subsequent login
6. THE registration flow SHALL work identically on both iOS and Android

### Requirement 3: Login & Authentication Flow E2E Tests

**User Story:** As a returning user, I want to log in with my credentials so that I can access my role-specific dashboard.

#### Acceptance Criteria

1. WHEN a registered user enters valid email and password, THEN the system SHALL authenticate and redirect to the correct role dashboard
2. WHEN a user enters an invalid email or password, THEN the system SHALL show an appropriate error message
3. WHEN a user taps "Forgot Password", THEN the system SHALL navigate to the forgot-password screen
4. WHEN a user completes the password reset flow, THEN the system SHALL allow login with the new password
5. WHEN an authenticated user relaunches the app, THEN the system SHALL restore the session and redirect to the correct dashboard

### Requirement 4: Family Booking Flow E2E Tests

**User Story:** As a family member, I want to browse nurses, view profiles, and request bookings so that I can find care for my loved one.

#### Acceptance Criteria

1. WHEN a family user navigates to Browse, THEN the system SHALL display a paginated list of available nurses
2. WHEN the family user applies filters (location, specialization), THEN the system SHALL update the nurse list accordingly
3. WHEN the family user taps a nurse card, THEN the system SHALL navigate to the nurse's public profile
4. WHEN the family user taps "Request Booking" and fills in details (date, shift, condition, budget), THEN the system SHALL create the booking with "pending" status
5. WHEN the family user views their bookings list, THEN the system SHALL display all bookings with correct status badges
6. WHEN the family user views a booking detail, THEN the system SHALL show nurse info, messages, and (if completed) a review form

### Requirement 5: Nurse Flow E2E Tests

**User Story:** As a nurse, I want to manage my availability and respond to booking requests so that I can coordinate with families.

#### Acceptance Criteria

1. WHEN a nurse user navigates to Availability, THEN the system SHALL display a weekly grid with three shifts per day
2. WHEN the nurse toggles a shift slot and saves, THEN the system SHALL persist the availability change
3. WHEN a nurse user views their bookings list, THEN the system SHALL display booking requests with unread indicators
4. WHEN the nurse taps "Accept" on a pending booking, THEN the system SHALL update the booking status and notify the family
5. WHEN the nurse taps "Decline" on a pending booking, THEN the system SHALL update the booking status accordingly
6. WHEN the nurse navigates to Messages, THEN the system SHALL display conversations grouped by booking

### Requirement 6: Admin Verification Flow E2E Tests

**User Story:** As an admin, I want to review nurse verification applications so that I can approve qualified nurses.

#### Acceptance Criteria

1. WHEN an admin user logs in, THEN the system SHALL display the admin dashboard with correct metrics
2. WHEN the admin navigates to Verifications, THEN the system SHALL display a filterable queue of verification requests
3. WHEN the admin applies a status filter (pending, under_review, verified, rejected), THEN the system SHALL update the queue accordingly
4. WHEN the admin taps a verification request, THEN the system SHALL show applicant info, documents, and audit log
5. WHEN the admin approves a verification, THEN the system SHALL update the nurse's verification status and log the action
6. WHEN the admin rejects a verification, THEN the system SHALL record the rejection with reason and log the action

### Requirement 7: CI/CD Integration

**User Story:** As a developer, I want Maestro E2E tests to run in CI so that regressions are caught before deployment.

#### Acceptance Criteria

1. WHEN a PR is opened against the main branch, THEN the CI pipeline SHALL run the Maestro E2E test suite
2. WHEN a Maestro test fails in CI, THEN the pipeline SHALL report the failure with flow name and screenshot
3. WHEN all Maestro tests pass in CI, THEN the pipeline SHALL report success
4. THE CI configuration SHALL support running on both pull requests and manual triggers

### Requirement 8: Test Data Management

**User Story:** As a developer, I want test data to be managed deterministically so that E2E tests are reliable and repeatable.

#### Acceptance Criteria

1. BEFORE any E2E test run, THE test harness SHALL ensure seed data exists in the database
2. EACH test flow SHALL use unique, non-colliding test accounts (e.g., timestamped emails)
3. AFTER a test run, THE test harness SHALL clean up test data or use isolated test schemas
4. THE seed data setup SHALL be scriptable and version-controlled

## Scope

### In-Scope
- Maestro test infrastructure and configuration for `apps/mobile/`
- 20+ E2E flow files covering registration, login, family booking, nurse management, and admin verification
- Test ID (`testID`) annotations on all interactive elements needed by Maestro
- CI/CD integration (GitHub Actions)
- Documentation for running tests locally and in CI
- Both iOS and Android support
- Configurable environment targets (local dev and staging)

### Out-of-Scope
- Unit or integration test improvements (existing Jest tests remain unchanged)
- Performance testing
- Visual regression / snapshot testing
- Testing of the web app (`apps/web`)
- Testing of shared packages in isolation
- Load testing
- Security/penetration testing
