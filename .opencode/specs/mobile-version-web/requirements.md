# Requirements Document: Mobile Version of HanapKalinga Web App

## Introduction

The HanapKalinga mobile app (Expo/React Native) currently has only a landing screen and root layout. This spec defines the full mobile version that mirrors the web app's functionality — a marketplace connecting Filipino families with verified private-duty nurses and caregivers. The mobile app uses the Airtable-inspired design patterns (near-black primary CTA, signature cards, generous whitespace, editorial section rhythm) from `apps/mobile/designs/DESIGN-airtable.md` but adapted to the web app's blue brand color palette (`brand-50` through `brand-900`) and its Space Grotesk/Manrope typography.

## Glossary

- **Family**: A user role representing a patient's family member seeking a nurse or caregiver
- **Nurse/Provider**: A user role representing a nurse (RN) or caregiver (TESDA NC II) offering services
- **Admin**: A user role managing verification, bookings, and platform oversight
- **Booking**: A request from a family to hire a nurse for a specific date and shift
- **Shift**: Time slot (Morning 6am-2pm, Afternoon 2pm-10pm, Evening 10pm-6am, Full Day)
- **Verification**: The process of validating a nurse's credentials (PRC license, TESDA cert, NBI clearance)
- **OTP**: One-time password sent via email for registration verification
- **PRC**: Philippine Regulatory Commission (nurse licensing body)
- **TESDA**: Technical Education and Skills Development Authority (caregiver certification)
- **NBI**: National Bureau of Investigation (clearance document)
- **Signature Card**: A full-bleed colored section card (from Airtable design) carrying brand voltage — adapted to brand blue tones
- **Canvas**: White page surface (from Airtable design token)
- **Section Rhythm**: The editorial pacing of alternating white canvas sections with signature color cards

## Requirements

### Requirement 1: Authentication & Onboarding

**User Story:** As a new user, I want to register or log in from my mobile device, so that I can access the platform.

#### Acceptance Criteria

1. WHEN a user opens the app, THE system SHALL display a landing screen with "HanapKalinga" branding, tagline, and two CTA buttons: "I need a nurse or caregiver" (family path) and "I am a nurse or caregiver" (provider path), plus a "Log in" text link
2. WHEN a user taps "Log in", THE system SHALL present an email + password login form with links to "Forgot password?" and "Create an account"
3. WHEN a user taps "Create an account" or either registration CTA, THE system SHALL present a multi-step registration wizard: Step 1 email input → Step 2 verify OTP → Step 3 choose role (family/nurse) → Step 4 fill profile → Step 5 set password
4. WHEN a user completes registration, THE system SHALL auto-authenticate and redirect to the appropriate role-based dashboard
5. WHEN a user taps "Forgot password?", THE system SHALL present an email input to send a password reset link
6. WHEN a user accesses a password reset link, THE system SHALL allow them to enter a new password
7. THE mobile auth SHALL use the same Supabase backend as the web app

### Requirement 2: Nurse Browsing & Profiles

**User Story:** As a family user or visitor, I want to browse and search for verified nurses and caregivers on my mobile device.

#### Acceptance Criteria

1. WHEN any user visits the Browse Nurses screen, THE system SHALL display a scrollable list of nurse cards showing: name, city, specializations (tags), daily rate, availability status badge, and provider type badge
2. WHEN a user taps a filter button, THE system SHALL present a filter sheet with: city dropdown, specialization multi-select, daily rate range, availability status, and provider type
3. WHEN a user taps a nurse card, THE system SHALL navigate to a nurse detail screen showing: full name, location with map, availability badge, specialization tags, bio text, hourly/daily rate cards, availability slots for the next 7 days, reviews list, and a "Request Booking" CTA button
4. WHEN the nurse detail screen loads, THE system SHALL fetch server-side rendered data from the Supabase backend

### Requirement 3: Family Dashboard

**User Story:** As a family user, I want to manage my bookings and profile from my mobile device.

#### Acceptance Criteria

1. WHEN a family user logs in, THE system SHALL display a dashboard home with: welcome banner (first visit only), "Find a nurse or caregiver" promo card linking to Browse Nurses, recent bookings list (3 max), and "Request a booking" CTA
2. WHEN a family user navigates to their profile, THE system SHALL display editable fields: full name, phone, region/city/barangay, address with save functionality
3. WHEN a family user navigates to My Bookings, THE system SHALL display a list of all bookings with: requested date, shift label, status badge, and unread message count badge
4. WHEN a family user taps a booking, THE system SHALL navigate to a booking detail screen showing: booking info, status badge, parsed booking notes card, optional review form (star rating + comment for completed bookings without reviews), and a message thread for chat with the nurse
5. WHEN a family user taps "Request a booking" from a nurse profile, THE system SHALL present a booking form with: requested date picker, patient condition selector (bedridden/mobile/assisted), shift selector, required skills chips, budget band dropdown, and additional notes textarea
6. THE family dashboard SHALL use bottom tab navigation with tabs: Home, Browse, Bookings, Messages, Profile

### Requirement 4: Nurse Dashboard

**User Story:** As a nurse/provider user, I want to manage my profile, availability, and bookings from my mobile device.

#### Acceptance Criteria

1. WHEN a nurse user logs in, THE system SHALL display a dashboard home with: verification status banner (showing current verification state), notifications panel, recent booking requests list (3 max), and CTA buttons for "Edit profile" and "Set availability"
2. WHEN a nurse user navigates to their profile editor, THE system SHALL display fields for: full name, phone, region/city/barangay, address, PRC license number, specializations multi-select, years experience, bio, hourly/daily rate ranges, profile photo upload, credential document uploads (PRC or TESDA), and NBI clearance upload — with change detection triggering re-verification
3. WHEN a nurse user navigates to Set Availability, THE system SHALL display a weekly calendar view with Previous/Next week navigation, allowing toggling of shifts (morning/afternoon/evening) as open/closed per day
4. WHEN a nurse user navigates to My Bookings, THE system SHALL display a list of booking requests with: date, shift, status badge, and unread message count badge
5. WHEN a nurse user taps a booking request, THE system SHALL navigate to a booking detail screen with: booking info, Accept/Decline buttons for pending bookings, booking details card, and message thread for chat with the family
6. WHEN a nurse user navigates to Messages, THE system SHALL display an inbox of conversations grouped by booking
7. THE nurse dashboard SHALL use bottom tab navigation with tabs: Home, Bookings, Messages, Availability, Profile

### Requirement 5: Admin Dashboard (Mobile)

**User Story:** As an admin, I want to manage the platform from my mobile device.

#### Acceptance Criteria

1. WHEN an admin user logs in, THE system SHALL display a dashboard with: 4 metric cards (pending verifications, under review, total bookings, total signups), quick actions links, and a verification status legend
2. WHEN an admin navigates to the verification queue, THE system SHALL display tabbed filter: All Active, Pending, Under Review, Approved, Rejected, Resubmission Required — with applicant cards showing name, city, provider type, submission date, status badge
3. WHEN an admin taps a verification item, THE system SHALL display a verification review screen with: document viewer (PRC/TESDA/NBI), applicant info, audit log, and action buttons (Approve/Reject/Request Resubmission/Mark Under Review) with optional rejection reason and review notes
4. WHEN an admin navigates to manage nurses, families, or bookings, THE system SHALL display lists with search/filter and detail screens
5. THE admin dashboard SHALL use a sidebar navigation or top-tab navigation with sections: Dashboard, Verifications, Nurses, Families, Bookings

### Requirement 6: Shared Components & Navigation

**User Story:** As any user, I want a consistent mobile experience with proper navigation and shared UI patterns.

#### Acceptance Criteria

1. THE system SHALL use expo-router for file-based navigation mirroring the web app's route structure
2. THE system SHALL implement bottom tab navigation for dashboard screens (nurse/family) and stack navigation for auth flows and detail screens
3. THE system SHALL implement the Airtable-inspired design patterns (section rhythm, signature cards, whitespace philosophy) adapted to the web's blue brand color palette
4. THE system SHALL implement a responsive design that works on both phone and tablet screen sizes
5. THE system SHALL handle loading, error, and empty states for all data-fetching screens
6. THE system SHALL implement pull-to-refresh on list screens

### Requirement 7: Messaging System

**User Story:** As a family or nurse user, I want to communicate in real-time about bookings.

#### Acceptance Criteria

1. WHEN a user is on a booking detail screen, THE system SHALL display a message thread showing all messages for that booking
2. WHEN a user sends a message, THE system SHALL persist it to Supabase and display it in real-time
3. WHEN a user navigates to Messages (inbox), THE system SHALL aggregate conversations grouped by booking showing: the other party's name, last message preview, timestamp, and unread count
4. THE message system SHALL support the same real-time behavior as the web version

### Requirement 8: Notifications

**User Story:** As any user, I want to receive and respond to in-app notifications.

#### Acceptance Criteria

1. WHEN a user has unread notifications, THE system SHALL display a badge indicator in the navigation
2. WHEN a user opens the notifications panel, THE system SHALL show a list of notifications with title, body, timestamp, and read/unread state
3. WHEN a user taps a notification, THE system SHALL mark it as read and navigate to the relevant screen
4. WHEN a user uses the Mark All Read action, THE system SHALL mark all notifications as read

## Scope

### In-Scope
- Full authentication flow (login, register, forgot/reset password, OTP verification)
- Public nurse browsing with filters and nurse detail profiles
- Family dashboard (home, browse nurses, request booking, booking list/detail, messages, profile)
- Nurse dashboard (home, booking list/detail, messages, availability calendar, profile with document uploads)
- Admin dashboard (home, verification queue/review, nurse/family/booking management)
- In-app messaging system (per-booking message threads, inbox)
- In-app notifications panel
- Bottom tab navigation for dashboards, stack navigation for auth and detail screens
- Airtable-inspired design system adapted to web brand colors
- Supabase integration reusing the existing shared backend
- Loading, error, and empty states for all screens

### Out-of-Scope
- Push notifications (future enhancement — MVP uses in-app notifications only)
- Offline mode / data caching (future enhancement)
- Video calls or voice calls
- Payment processing within the mobile app
- Multi-language support (future enhancement)
- Dark mode (future enhancement)
- Biometric authentication (future enhancement)
- Widget or home screen quick actions
- Tablet-specific layout (responsive but phone-first)
