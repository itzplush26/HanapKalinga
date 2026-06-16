# Requirements Document: Mobile Feature Parity

## Introduction
Implement all functionality gaps identified in the NurseLink mobile app to achieve full feature parity with the web app. Six feature groups are addressed: Care Requests (family + nurse), Nurse Applications, Booking Lifecycle Actions (cancel, complete, confirm, dispute), Incident Reporting & User Blocking, Profile Photo Upload, and Theme Toggle.

## Glossary
- **Care Request**: A family-published posting describing care needs that nurses can browse and apply to
- **Application**: A nurse's expression of interest in a care request
- **Booking Lifecycle**: The state machine governing a booking: pending → accepted → pending_completion → completed (or cancelled/disputed)
- **Incident Report**: A formal user-submitted report of inappropriate behavior, reviewed by admin
- **User Block**: A mutual visibility restriction between two users

## Requirements

### Requirement 1: Care Requests — Family Side
**User Story:** As a family, I want to create, view, and manage care requests, so that I can find care providers who match my specific needs.

#### Acceptance Criteria
1. WHEN a family taps "Care Requests" on their dashboard, THE system SHALL show a list of their care requests with status
2. WHEN a family taps "Post a care request", THE system SHALL display a form with: title, care_type, region/city/barangay, required_specializations, budget_band, start_date, and description
3. WHEN a family submits the form, THE system SHALL create the care request and redirect to its detail page
4. WHEN a family views a care request detail, THE system SHALL show all fields, status, and received applications count
5. WHEN a family taps "Edit" on their care request, THE system SHALL prefill the form and allow updates
6. WHEN a family taps "Delete", THE system SHALL prompt confirmation and soft-delete the request

### Requirement 2: Care Requests — Nurse Side & Applications
**User Story:** As a nurse, I want to browse open care requests and apply to them, so that I can find work opportunities that match my skills.

#### Acceptance Criteria
1. WHEN a nurse taps "Care Requests" or "Find work", THE system SHALL display a list of open care requests with title, location, care_type, budget, and specializations
2. WHEN a nurse taps a care request, THE system SHALL show full details
3. WHEN a nurse taps "Apply", THE system SHALL create an application and show "Applied" status
4. WHEN a nurse views "My Applications", THE system SHALL list their submitted applications with status (pending/withdrawn/accepted/rejected)
5. WHEN a nurse views an application detail, THE system SHALL show the associated care request info

### Requirement 3: Booking Lifecycle — Cancel, Complete, Confirm, Dispute
**User Story:** As a user (nurse or family), I want to manage bookings through their full lifecycle, so that I can handle schedule changes and completion properly.

#### Acceptance Criteria
1. WHEN a nurse taps "Cancel booking" on a pending/accepted booking, THE system SHALL show a reason selection modal with predefined reasons
2. WHEN the nurse confirms cancellation, THE system SHALL update the booking status to "cancelled" and notify the family
3. WHEN a family taps "Cancel booking" on a pending/accepted booking, THE system SHALL show a family-appropriate reason selection modal
4. WHEN the family confirms cancellation, THE system SHALL update to "cancelled" and notify the nurse
5. WHEN a nurse taps "Mark shift complete" on an accepted booking past its date, THE system SHALL set status to "pending_completion"
6. WHEN a family views a "pending_completion" booking, THE system SHALL show confirm/dispute options
7. WHEN a family confirms completion, THE system SHALL set status to "completed"
8. WHEN a family disputes, THE system SHALL prompt for a description and set status to "disputed"

### Requirement 4: Incident Reporting & User Blocking
**User Story:** As a user, I want to report inappropriate behavior or block other users, so that I feel safe on the platform.

#### Acceptance Criteria
1. WHEN a user taps "More options" on a booking detail, THE system SHALL show "Report this user" and "Block this user" options
2. WHEN a user selects "Report this user", THE system SHALL show a form with category dropdown and description textarea
3. WHEN the user submits a report (min 50 characters), THE system SHALL create an incident report
4. WHEN a user selects "Block this user", THE system SHALL confirm and create a block record
5. WHEN two users are blocked, THE system SHALL hide them from each other's messages and search

### Requirement 5: Incident Reports — Admin View
**User Story:** As an admin, I want to review incident reports on mobile, so that I can moderate the platform.

#### Acceptance Criteria
1. WHEN an admin taps "Reports" in admin dashboard, THE system SHALL list incident reports with category, reporter, reported user, status, and date
2. WHEN an admin taps a report, THE system SHALL show full details and allow status updates (open → under_review → resolved/dismissed)

### Requirement 6: Profile Photo Upload
**User Story:** As a user, I want to upload a profile photo from my mobile device, so that my profile looks complete.

#### Acceptance Criteria
1. WHEN a user taps their profile avatar, THE system SHALL allow selecting a photo from the gallery
2. THE system SHALL support cropping before upload
3. THE system SHALL compress and upload the photo to storage
4. THE system SHALL display the uploaded photo across the app

### Requirement 7: Theme Toggle
**User Story:** As a user, I want to toggle dark/light mode from my mobile profile, so that I can choose my preferred appearance.

#### Acceptance Criteria
1. WHEN a user visits their profile page, THE system SHALL show a theme toggle switch
2. WHEN the user toggles the switch, THE system SHALL persist the preference and apply the theme immediately

## Scope

### In-Scope
- All six feature groups listed above
- Mobile app screens and components only (web already has these features)
- API routes already exist on web — mobile will reuse them where possible
- Shared types and constants from `@hanapkalinga/shared`

### Out-of-Scope
- Web app changes (web already has parity)
- Email notification templates (already exist on web)
- Backend/API changes unless mobile requires new endpoints
- E2E Maestro test flows (can be added in a follow-up)
