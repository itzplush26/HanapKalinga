# Implementation Plan: Mobile Feature Parity

## Overview

Seven phases covering all six feature groups, ordered by dependency: foundational navigation/hooks first, then Care Requests (largest surface area), Booking Lifecycle (touches existing screens), Safety features, Admin Reports, and finally polish features. Each phase includes checkpoints for validation.

## Tasks

### Phase 1: Navigation & Infrastructure

- [ ] 1. **Add new route entries to role layouts**
  - Add "Care Requests" tab item to family `_layout.tsx` and nurse `_layout.tsx`
  - Add "Reports" entry to admin `_layout.tsx`
  - Create stub screen files for all new routes
  - _Requirements: 1.1, 2.1, 5.1_

- [ ] 2. **Create reusable UI components**
  - `CancelBookingModal` — modal with reason picker + custom reason input
  - `CareRequestCard` — card showing title, location, care_type, budget, status
  - `ReportUserMenu` — dropdown with Report/Block options
  - _Requirements: 3.1, 3.3, 4.1_

- [ ] 3. **Checkpoint — Navigation exists**
  - All new routes are reachable from their respective role dashboards
  - No TypeScript errors
  - Ask user if questions arise

### Phase 2: Care Requests — Family Screens

- [ ] 4. **Build `useFamilyCareRequests` hook**
  - Fetch care requests by `family_id`, ordered by `created_at DESC`
  - Return typed data + loading/error/refetch
  - _Requirements: 1.1_

- [ ] 5. **Build `useCareRequestDetail` hook**
  - Fetch single care request by ID with received applications count
  - Return typed data + loading/error/refetch
  - _Requirements: 1.4_

- [ ] 6. **Build Family Care Requests list screen**
  - `(family)/care-requests/index.tsx` — list with EmptyState, FlatList, refresh
  - "Post a care request" button in header
  - _Requirements: 1.1_

- [ ] 7. **Build Create/Edit Care Request screens**
  - `(family)/care-requests/new.tsx` — form with: title, care_type, region/city/barangay, required_specializations (chip picker), budget_band, start_date, description
  - `(family)/care-requests/[id]/edit.tsx` — same form pre-filled
  - Reuse existing `RegionCitySelects`, `Chip` components
  - Validate with shared Zod schema from `@hanapkalinga/shared/validations`
  - _Requirements: 1.2, 1.3, 1.5_

- [ ] 8. **Build Care Request detail screen**
  - `(family)/care-requests/[id]/index.tsx` — show all fields, status badge, Edit/Delete buttons
  - Delete prompts confirmation, soft-deletes via Supabase update
  - _Requirements: 1.4, 1.6_

- [ ] 9. **Checkpoint — Family Care Requests complete**
  - Family can create, view, edit, delete care requests
  - All screens handle loading/error/empty states
  - Ask user if questions arise

### Phase 3: Care Requests — Nurse Side & Applications

- [ ] 10. **Build `useNurseCareRequests` hook**
  - Fetch open care requests with `status = 'open'`, ordered by `created_at DESC`
  - _Requirements: 2.1_

- [ ] 11. **Build Nurse Care Requests browse screen**
  - `(nurse)/care-requests/index.tsx` — list of open requests with CareRequestCard
  - "My Applications" link in header
  - _Requirements: 2.1_

- [ ] 12. **Build Nurse Care Request detail + Apply screen**
  - `(nurse)/care-requests/[id]/index.tsx` — full request details + "Apply" button
  - Apply calls Supabase insert into `care_request_applications`
  - Show "Applied" state after application
  - _Requirements: 2.2, 2.3_

- [ ] 13. **Build Nurse Applications screen**
  - `(nurse)/applications/index.tsx` — list of submitted applications with status
  - Each card shows care request title + city + application status
  - _Requirements: 2.4, 2.5_

- [ ] 14. **Checkpoint — Care Requests parity complete**
  - Nurses browse, view, and apply to care requests
  - Nurses view application history
  - Family CRUD works end-to-end
  - Ask user if questions arise

### Phase 4: Booking Lifecycle Actions

- [ ] 15. **Extend `useBookingDetail` with action mutations**
  - Add `cancel(reason, cancelledBy)`, `markComplete()`, `confirmCompletion()`, `dispute(description)` methods
  - Each calls the existing web API endpoint via fetch
  - Return success/error state
  - _Requirements: 3.1–3.8_

- [ ] 16. **Add Cancel button to Nurse booking detail**
  - Show "Cancel booking" button when status is pending or accepted
  - Opens `CancelBookingModal` with nurse-specific reasons
  - On confirm, calls cancel mutation and refreshes
  - _Requirements: 3.1, 3.2_

- [ ] 17. **Add Cancel button to Family booking detail**
  - Same pattern with family-specific reasons
  - _Requirements: 3.3, 3.4_

- [ ] 18. **Add Mark Complete to Nurse booking detail**
  - Show "Mark shift complete" button when status is accepted and date is past
  - Calls `markComplete()` mutation
  - Show success message after
  - _Requirements: 3.5_

- [ ] 19. **Add Confirm/Dispute to Family booking detail**
  - When status is `pending_completion`, show confirmation card
  - "Confirm shift complete" button calls `confirmCompletion()`
  - "Dispute" button expands textarea, calls `dispute(description)`
  - _Requirements: 3.6, 3.7, 3.8_

- [ ] 20. **Add `ReportUserMenu` to booking detail pages**
  - Add "More options" button (three dots) to both nurse and family booking detail headers
  - Menu: "Report this user" and "Block this user"
  - Report form: category dropdown + description (min 50 chars)
  - Block: confirmation dialog
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 21. **Checkpoint — Booking lifecycle complete**
  - All booking actions work: cancel, mark-complete, confirm-complete, dispute
  - Report and block work from booking detail
  - Ask user if questions arise

### Phase 5: Admin Reports

- [ ] 22. **Build `useAdminReports` hook**
  - Fetch incident reports with reporter/reported profiles joined
  - Order by `created_at DESC`
  - _Requirements: 5.1_

- [ ] 23. **Build Admin Reports list screen**
  - `(admin)/reports/index.tsx` — list with category, reporter, reported user, status, date
  - Empty state when no reports
  - _Requirements: 5.1_

- [ ] 24. **Build Admin Report detail screen**
  - `(admin)/reports/[id]/index.tsx` — full report details
  - Status update buttons: "Mark under review", "Resolve", "Dismiss"
  - _Requirements: 5.2_

- [ ] 25. **Checkpoint — Admin Reports complete**
  - Admin views report list and detail
  - Admin can update report status
  - Ask user if questions arise

### Phase 6: Profile Photo & Theme Toggle

- [ ] 26. **Add Profile Photo Upload to Family & Nurse profile screens**
  - Import `expo-image-picker` for gallery selection
  - Add `ProfilePhotoUploader` component with avatar tap → pick → crop → upload flow
  - Upload to Supabase Storage, update `profiles.profile_photo_url`
  - Display uploaded photo in `ProfileAvatar` component across app
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 27. **Add Theme Toggle to profile screens**
  - Add a switch/button on both Family and Nurse profile pages
  - Toggle calls `ThemeContext.setTheme()` which persists to AsyncStorage
  - Show current theme state
  - _Requirements: 7.1, 7.2_

- [ ] 28. **Checkpoint — Profile features complete**
  - Users can upload and see profile photos
  - Theme toggle works and persists
  - Ask user if questions arise

### Phase 7: Final Validation

- [ ] 29. **Run full TypeScript check**
  - `npx tsc --noEmit` — fix any type errors
  - Verify all imports resolve correctly from `@hanapkalinga/shared`

- [ ] 30. **Run existing Jest tests**
  - `npx jest` — confirm no regressions
  - Fix any test breakage from hook changes

- [ ] 31. **Manual smoke test on simulator/device**
  - Login as family → create care request → view it
  - Login as nurse → browse care requests → apply
  - Login as family → accept nurse → complete flow
  - Cancel booking → verify notification
  - Report user → verify in admin reports
  - Upload profile photo → verify visibility
