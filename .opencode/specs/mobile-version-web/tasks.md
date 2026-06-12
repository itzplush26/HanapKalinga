# Implementation Plan: Mobile Version of HanapKalinga Web App

## Overview

Eight phases build the mobile app from foundation through full feature parity. Phase 1 establishes the design system and infrastructure (missing from original). Phase 2 adds the shared data layer so every screen after that has a consistent data-fetching pattern. Authentication comes next, followed by public browsing, then role-specific dashboards (family -> nurse -> admin), finishing with polish. Each phase ends with a mandatory checkpoint.

---

## Tasks

### Phase 1: Project Setup & Design System Foundation

**Goal**: Install all dependencies, establish the design token system, build UI primitives and shared wrappers, configure app.json, and set up navigation infrastructure.

- [x] 1. **Install all dependencies**
  - Verify existing dependencies in `package.json` are present
  - Install missing production deps: `lucide-react-native`, `expo-image-picker`, `expo-document-picker`, `@react-native-community/datetimepicker`, `expo-file-system`, `expo-sharing`, `zod`, `@react-navigation/bottom-tabs`
  - Install font packages: `@expo-google-fonts/space-grotesk`, `@expo-google-fonts/manrope`
  - Install dev deps: `jest`, `@testing-library/react-native`, `@types/jest`
  - Configure `useFonts` with SpaceGrotesk + Manrope in root layout
  - _Requirements: Design Principle 4_

- [x] 2. **Create design token system** (`src/theme/`)
  - `colors.ts` - brand palette (50->900), surface colors (soft, strong, dark), signature colors (cream, yellow, mustard), semantic colors (link, info, success, error), ink, body, muted, hairline, canvas
  - `typography.ts` - fontFamily (display, body, bodyMedium, bodySemiBold), mobile-adapted size scale (32px->12px), lineHeight
  - `spacing.ts` - all tokens from design doc (xxs 4px -> section 64px)
  - `rounded.ts` - xs 2, sm 6, md 10, lg 12, pill/full 9999
  - `index.ts` - unified export
  - _Requirements: Design Token System section_

- [x] 3. **Build UI primitives** (all in `src/components/ui/`)
  - `Button.tsx` - variants: primary, secondary, ghost, link. Min height 48pt. Loading spinner, pressed opacity.
  - `Input.tsx` - 48pt height, rounded.sm, hairline border, brand-300 focus. SecureTextEntry toggle. Error state.
  - `Card.tsx` - variants: default, signature (brand bg, white text), cream (brand-50 bg). rounded prop.
  - `Badge.tsx` - color variants: success, pending, error, info, neutral
  - `Skeleton.tsx` - animated pulse. Variants: text, circle, rectangle.
  - `Separator.tsx` - 1pt hairline, horizontal/vertical
  - `IconButton.tsx` - 44x44pt circular, hairline border, brand icon
  - `TextLink.tsx` - inline link in semantic.link. Optional underline.
  - `Chip.tsx` - rounded-pill toggle. Selected: brand-600 bg. Unselected: white bg, brand-200 border.
  - _Requirements: Reusable UI Primitives, Design Principle 6_

- [x] 4. **Build shared wrappers and infrastructure**
  - `ScreenWrapper` - SafeAreaView + KeyboardAvoidingView (iOS behavior="padding") + optional ScrollView
  - `ErrorBoundary` - catches render errors, shows fallback with retry button
  - `LoadingOverlay` - full-screen semi-transparent spinner for async operations
  - _Requirements: Design Principle 6_

- [x] 5. **Configure app.json** (`app.json`)
  - Add `scheme` for deep linking (hanapkalinga)
  - Configure `expo-splash-screen` with brand-600 background and icon
  - Configure deep linking for auth callback URL (matching web's `/auth/callback`)
  - Set status bar style (dark), orientation lock (portrait)
  - _Requirements: 1.7_

- [x] 6. **Set up Supabase typed client**
  - Generate Supabase types from existing schema (or manually mirror `web/types/database.types.ts`)
  - Create `src/lib/supabase.ts` - typed Supabase client using the existing `lib/supabase.ts` pattern with SecureStore adapter
  - Create TypeScript type exports for all database row types (re-exporting from shared or local)
  - _Requirements: 1.7_

- [x] 7. **Configure navigation infrastructure**
  - Set up `app/_layout.tsx` with root Stack (no headers), StatusBar, font loading, ErrorBoundary, splash screen hide
  - Create route group layouts as placeholders:
    - `(auth)/_layout.tsx` - stack with slide animation
    - `(public)/_layout.tsx` - stack
    - `(family)/_layout.tsx` - Tab navigator (5 tabs: Home, Browse, Bookings, Messages, Profile)
    - `(nurse)/_layout.tsx` - Tab navigator (5 tabs: Home, Bookings, Messages, Availability, Profile)
    - `(admin)/_layout.tsx` - top-tab or scrollable header tabs
  - Create `src/components/navigation/TabBar.tsx` - branded bottom tab bar with Lucide icons, brand-600 active color, badge support for unread counts
  - **Architecture note**: The Family "Browse" tab deep-links to `(public)/nurses/` via `expo-router`'s `useRouter()`. The public route group is shared, not duplicated.
  - _Requirements: Navigation Architecture, Route Map_

- [x] 8. **Checkpoint - Design system and infrastructure complete**
  - Verify all tokens match design doc values
  - Verify all UI primitives render each variant correctly
  - Verify fonts load on both iOS and Android simulators
  - Verify deep linking works for a test URL scheme
  - Verify typed Supabase client connects and returns typed data
  - Ask the user if questions arise

### Phase 2: Shared Data Layer & Utilities

**Goal**: Create consistent data-fetching patterns, shared utility functions, and testing infrastructure that every screen inherits.

- [x] 9. **Create shared utility functions** (`src/lib/helpers.ts`)
  - `formatDate(date: string)` - "Mon, Jun 15" format
  - `getShiftLabel(shift: Shift)` - "Morning (6AM-2PM)"
  - `formatRate(rate: number)` - "P1,500/day" or "P200/hr"
  - `getStatusColor(status: BookingStatus | VerificationStatus)` - maps to Badge color variant
  - `buildProfileName(profile: Profile)` - full name fallback chain
  - `getInitials(name: string)` - for avatar fallback
  - `cn(...classes: (string | undefined)[])` - class name merge utility (like web's tailwind-merge pattern)
  - _Requirements: all_

- [x] 10. **Create base data-fetching hook pattern** (`src/lib/hooks/`)
  - Create `useSupabaseQuery` base hook: takes Supabase query builder, returns `{ data, loading, error, refetch }`
  - Create `useSupabaseMutation` base hook: takes mutation function, returns `{ mutate, loading, error }`
  - Document the pattern: every data-fetching screen uses one of these two base hooks
  - Note: These are thin wrappers - not a custom query library. They enforce consistent return shapes and error handling.
  - _Requirements: all_

- [x] 11. **Set up testing infrastructure**
  - Configure Jest with React Native Testing Library preset
  - Create `/__tests__/` directory structure mirroring src/
  - Create a test helper file with common mock factories (mocked navigation, mocked supabase client)
  - Add `test` and `test:watch` scripts to `package.json`
  - _Requirements: Testing Strategy section_

- [x] 12. **Build shared domain components** (`src/components/`)
  - `EmptyState` - icon + title + subtitle + optional CTA Button. Props: `icon`, `title`, `subtitle`, `actionLabel?`, `onAction?`. Used by nurse list, booking list, notifications, messages inbox.
  - `DocumentUploader` - uses `expo-document-picker` with file type filter (PDF/images) and size cap (5MB). Shows file name + remove button after selection. Loading state during upload. Error state for oversized/invalid files. Used by registration and nurse profile.
  - `RegionCitySelects` - two cascading pickers: region selector (17 PH regions) -> city selector (filtered cities for selected region). Uses native Picker or scrollable list. Used by registration, family profile, nurse profile.
  - `StarRating` - row of 5 touchable stars. Half-star support. Read-only mode via prop. Accessible labels per star. Used by booking review and nurse detail display.
  - _Requirements: 1.3, 3.2, 4.2, 6_

- [x] 13. **Write tests for UI primitives** (establishes testing patterns)
  - Test Button renders all variants correctly
  - Test Input shows error state, handles text input
  - Test Badge renders correct color for each status
  - Test Skeleton renders with correct dimensions
  - _Requirements: Testing Strategy, Unit Tests_

- [x] 14. **Checkpoint - Data layer complete**
  - Verify helpers return correct formatted values
  - Verify base hooks return correct shape (mock a Supabase call)
  - Verify tests run and pass (`npm test`)
  - Ask the user if questions arise

### Phase 3: Authentication & Onboarding

**Goal**: Build the full auth flow - landing screen, auth context, login, multi-step registration (split into individual tasks), password reset.

- [x] 15. **Build Auth context** (`src/contexts/AuthContext.tsx`)
  - Wraps app with Supabase `onAuthStateChange` listener
  - On cold start: restore session from `expo-secure-store` (already configured in lib/supabase.ts)
  - Expose: `user`, `profile`, `isLoading`, `signOut`, `refreshProfile`
  - Provide role-based redirect helper (used by layout files)
  - _Requirements: 1.6, 1.7_

- [x] 16. **Write auth tests**
  - Test: auth context returns correct user after login
  - Test: signOut clears session
  - Test: role-based redirect returns correct target
  - _Requirements: Testing Strategy_

- [x] 17. **Build Landing screen** (`app/index.tsx`)
  - Hero: `APP_NAME` in SpaceGrotesk displayLg, tagline in Manrope body
  - Two primary CTAs: "I need a nurse or caregiver" -> registration (family path), "I am a nurse or caregiver" -> registration (provider path)
  - "Log in" TextLink at bottom
  - If already authenticated: redirect to role-appropriate dashboard
  - _Requirements: 1.1_

- [x] 18. **Build Login screen** (`(auth)/login.tsx`)
  - Email + password Inputs with zod validation
  - "Forgot password?" and "Create an account" TextLinks
  - Error state: "Invalid email or password" on auth failure
  - On success: redirect to role-appropriate dashboard
  - _Requirements: 1.2_

- [x] 19. **Build Forgot & Reset Password screens**
  - `(auth)/forgot-password.tsx` - email Input, send reset link Button, success confirmation, back-to-login link
  - `(auth)/update-password.tsx` - new password + confirm Inputs, update Button, success state with login link
  - Handle deep link from password reset email
  - _Requirements: 1.5, 1.6_

- [x] 20. **Registration Step 1: Email** (`(auth)/register/index.tsx`)
  - Email Input with validation
  - "Next" Button -> sends OTP via Supabase `signInWithOtp`
  - Error handling for invalid/duplicate email
  - _Requirements: 1.3_

- [x] 21. **Registration Step 2: OTP Verification** (`(auth)/register/verify-otp.tsx`)
  - 6 individual digit input boxes (auto-advance on type)
  - "Verify" Button -> confirms OTP via Supabase
  - "Resend code" TextLink with 30-second countdown timer
  - Error state: "Invalid verification code"
  - _Requirements: 1.3_

- [x] 22. **Registration Step 3: Role Selection** (`(auth)/register/choose-role.tsx`)
  - Two large Card options tappable: "I am a family member looking for care" (family) and "I am a nurse or caregiver" (provider)
  - Selected card: brand-600 border + checkmark icon. Unselected: hairline border.
  - "Continue" Button (enabled only when role is selected)
  - _Requirements: 1.3_

- [x] 23. **Registration Step 4: Profile Form** (`(auth)/register/profile.tsx`)
  - Dynamic form based on role selection from Step 3:
    - **Family**: full_name, phone, region+city+barangay (RegionCitySelects), address, patient_name. All validated with zod.
    - **Nurse**: full_name, phone, region+city+barangay, address, provider_type toggle (nurse/caregiver), specializations Chip multi-select, years_experience Input, bio Textarea, hourly_rate + daily_rate range inputs, DocumentUploader for PRC/TESDA cert, DocumentUploader for NBI clearance
  - Zod validation schema from @hanapkalinga/shared
  - **Architecture note**: File uploads use `expo-image-picker` -> Supabase Storage via the existing `lib/supabase.ts` client - reuses web's upload logic
  - "Next" Button (disabled while uploading docs)
  - _Requirements: 1.3_

- [x] 24. **Registration Step 5: Set Password** (`(auth)/register/set-password.tsx`)
  - Password + confirm password Inputs
  - Minimum length validation (8 characters), show password toggle
  - "Create account" Button -> finalizes signup via Supabase `updateUser`
  - On success: auto-authenticated + redirect to role-based dashboard
  - _Requirements: 1.3, 1.4_

- [x] 25. **Build auth redirect middleware**
  - In each layout file: check auth state + role before rendering children
  - `(family)/_layout.tsx` - redirect unauthenticated -> landing; wrong role -> own dashboard
  - `(nurse)/_layout.tsx` - same pattern
  - `(admin)/_layout.tsx` - same pattern
  - `(public)/_layout.tsx` - no auth check (public)
  - _Requirements: Correctness Properties 1, 2_

- [x] 26. **Write auth flow tests**
  - Test: complete registration flow navigates correctly step-by-step
  - Test: login with wrong credentials shows error
  - Test: auth redirect sends wrong-role user to correct dashboard
  - Test: password reset flow handles deep link
  - _Requirements: Testing Strategy_

- [x] 27. **Checkpoint - Auth flow complete**
  - Verify: register as family -> lands on family dashboard
  - Verify: register as nurse -> lands on nurse dashboard
  - Verify: login with wrong credentials shows inline error
  - Verify: OTP verification works end-to-end
  - Verify: forgot/reset password flow works via email deep link
  - Verify: authenticated user redirected from landing to dashboard
  - Verify: session restored on app cold start
  - Verify: all auth tests pass
  - Ask the user if questions arise

### Phase 4: Public Screens (Browse Nurses & Profiles)

**Goal**: Build public-facing nurse browsing with filters, nurse detail, and static legal screens.

- [ ] 28. **Create data hooks for public screens**
  - `useNurses(filters)` - paginated nurse list with filter params, uses `useSupabaseQuery` base
  - `useNurseDetail(id)` - composite hook fetching profile + nurse record + availability (next 7 days) + reviews in parallel
  - `useNurseAvailability(nurseId, days)` - fetches availability for next N days
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 29. **Build Browse Nurses screen** (`(public)/nurses/index.tsx`)
  - FlatList of NurseCard with pull-to-refresh + pagination on endReached
  - NurseCard shows: avatar (initial fallback via `getInitials`), full_name, city, specialization Chip row, daily_rate, availability Badge, provider_type Badge
  - Filter icon button in header -> opens NurseFilters bottom sheet
  - EmptyState: "No nurses found matching your filters."
  - LoadingState on initial fetch
  - _Requirements: 2.1, 6.5, 6.6_

- [ ] 30. **Build Nurse Filters bottom sheet** (`src/components/nurse-filters.tsx`)
  - City picker (FlatList of PH_CITIES from shared constants)
  - Specialization multi-select (Chip list from PROVIDER_SPECIALIZATIONS)
  - Daily rate range selector (predefined bands from shared constants)
  - Availability status toggle: available_now / available_next_week / any
  - Provider type toggle: nurse / caregiver / both
  - "Apply" Button (primary) and "Reset" TextLink
  - Uses `@react-navigation/bottom-sheet` or a custom modal presentation
  - _Requirements: 2.1_

- [ ] 31. **Build Nurse Detail screen** (`(public)/nurses/[id].tsx`)
  - ScrollView with sections:
    - Profile header: avatar (large initial circle), full_name, city with map link, availability Badge
    - Specialization Chip row
    - Bio section (body text)
    - Rate cards in 2-column layout: hourly rate Card + daily rate Card (Card variant="default", brand accent)
    - Availability preview: next 7 days (read-only cells, green=open, gray=closed)
    - Reviews section: StarRating + comment list. Empty state: "No reviews yet."
    - Sticky bottom "Request Booking" Button (primary) -> `(family)/bookings/new?nurseId={id}` (redirects to login if unauthenticated)
  - LoadingState while fetching (Skeleton for each section)
  - _Requirements: 2.2, 2.3_

- [ ] 32. **Build Terms & Privacy screens** (`(public)/terms.tsx`, `(public)/privacy.tsx`)
  - ScrollView of legal text from web's content
  - ScreenWrapper with safe area
  - _Requirements: 8_

- [ ] 33. **Write tests for public screens**
  - Test: NurseCard renders all fields correctly
  - Test: NurseFilters applies filter params and resets
  - Test: NurseDetail renders all sections with mock data
  - Test: pagination loads more nurses on endReached
  - _Requirements: Testing Strategy_

- [ ] 34. **Checkpoint - Public browsing complete**
  - Verify: nurse list loads with pagination, pull-to-refresh works
  - Verify: filters change result set correctly
  - Verify: nurse detail shows all sections with real data
  - Verify: loading states appear during fetch, error states show retry
  - Verify: empty states show when no results / no reviews
  - Verify: all public screen tests pass
  - Ask the user if questions arise

### Phase 5: Family Dashboard

**Goal**: Build the family user's full dashboard with bottom tab navigation, booking flow, messaging, and notifications.

- [ ] 35. **Create data hooks for family screens**
  - `useFamilyProfile(id)` - fetches profile + family record
  - `useFamilyBookings(familyId)` - fetches bookings with nurse info join
  - `useBookingDetail(bookingId)` - fetches booking + family + nurse + messages
  - `useMessages(bookingId)` - real-time message subscription via Supabase Realtime
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 36. **Build Family tab layout** (`(family)/_layout.tsx`)
  - Bottom TabBar with 5 tabs: Home (house), Browse (search), Bookings (calendar), Messages (message-square), Profile (user)
  - Brand-600 active color, muted inactive, badge counts from AuthContext
  - Browse tab deep-links to `(public)/nurses/` route
  - _Requirements: 3.6_

- [ ] 37. **Build Family Dashboard Home** (`(family)/index.tsx`)
  - `FamilyWelcomeBanner` - shown on first visit (checked via AsyncStorage flag), brand gradient background, dismissible
  - Promo Card: "Find a nurse or caregiver" with brand-600 accent, tap -> Browse tab
  - Recent bookings: FlatList of BookingCard (3 max), "View all" TextLink -> Bookings tab
  - CTA: "Request a booking" Button -> opens nurse selection (redirects to Browse tab)
  - _Requirements: 3.1_

- [ ] 38. **Build Family Profile screen** (`(family)/profile.tsx`)
  - Scrollable form: full_name, phone, region+city+barangay (RegionCitySelects), address
  - "Save" Button -> upserts profiles + families tables
  - LoadingState while fetching, success toast on save
  - _Requirements: 3.2_

- [ ] 39. **Build Family Bookings list** (`(family)/bookings/index.tsx`)
  - FlatList of BookingCard with pull-to-refresh
  - BookingCard: requested_date, shift label, status Badge, unread message count Badge
  - EmptyState: "No bookings yet. Find a nurse to get started." + "Browse nurses" CTA Button
  - _Requirements: 3.3_

- [ ] 40. **Build New Booking screen** (`(family)/bookings/new.tsx`)
  - If no `?nurseId`: show prompt "Select a nurse first" with Button -> Browse tab
  - `NurseSummaryCard` at top (if nurseId): avatar, name, city, rate
  - `BookingForm`:
    - Date picker (`@react-native-community/datetimepicker`, min: tomorrow, max: +30 days)
    - Patient condition selector: 3 tappable Cards (bedridden, mobile, assisted), selected highlights in brand-600
    - Shift selector: 4 Chip options (morning, afternoon, evening, full_day)
    - Required skills: Chip multi-select from BOOKING_SKILLS constant
    - Budget band: dropdown/picker from predefined ranges (shared constants)
    - Additional notes: Textarea
  - Form validation via zod schema
  - "Submit Request" Button -> creates booking with structured notes JSON, shows success screen with "View Booking" Button
  - _Requirements: 3.5_

- [ ] 41. **Build Family Booking Detail** (`(family)/bookings/[id].tsx`)
  - Booking info header: requested_date, shift, status Badge
  - `BookingDetailCard` - parses notes JSON into readable labeled sections
  - `BookingReviewForm` - shown only if status=completed AND no existing review. StarRating + comment Textarea + submit Button
  - `MessageThread` - real-time chat with the nurse (reused from Task 42)
  - Related bookings list (optional) - "Other bookings with this nurse"
  - _Requirements: 3.4, 7.1_

- [ ] 42. **Build MessageThread component** (`src/components/message-thread.tsx`)
  - FlatList of messages, newest at bottom, auto-scroll on new message
  - Message bubble: sender's messages right-aligned (brand-600 bg), recipient left-aligned (slate-100 bg)
  - TextInput + Send icon button at bottom (keyboard aware)
  - Real-time subscription via Supabase Realtime: listens for new messages on `booking_id=eq.{id}`
  - LoadingState for initial fetch
  - Error state for failed send: message shows error icon, tap to retry
  - Reused by: family booking detail, nurse booking detail, admin booking detail (readOnly mode)
  - _Requirements: 7.1, 7.2, Correctness Property 4_

- [ ] 43. **Build Notifications Panel** (`src/components/notifications-panel.tsx`)
  - FlatList of notifications: title, body, timestamp, read/unread indicator (bold vs normal text)
  - Tap notification -> mark as read + navigate to relevant screen (booking detail, verification review)
  - "Mark All Read" TextLink in header
  - Real-time subscription to `public:notifications` with filter `user_id=eq.{userId}`
  - EmptyState: "No notifications yet."
  - Badge count wired into TabBar (via AuthContext unread count)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 44. **Write tests for family dashboard**
  - Test: tab navigation renders all 5 tabs correctly
  - Test: new booking form validates all fields
  - Test: BookingDetailCard parses notes JSON correctly
  - Test: MessageThread sends and displays messages
  - Test: NotificationsPanel marks items as read
  - _Requirements: Testing Strategy_

- [ ] 45. **Checkpoint - Family dashboard complete**
  - Verify: all 5 tabs render and navigate correctly (Browse deep-links to public nurses)
  - Verify: new booking creates, appears in bookings list, and nurse can see it
  - Verify: booking detail shows all info + message thread works in real-time
  - Verify: review form appears on completed bookings and submits
  - Verify: notifications appear and mark as read
  - Verify: all tests pass
  - Ask the user if questions arise

### Phase 6: Nurse Dashboard

**Goal**: Build the nurse/provider dashboard with availability calendar, bookings, messages inbox, and profile with document uploads.

- [ ] 46. **Create data hooks for nurse screens**
  - `useNurseDashboard(nurseId)` - composite: profile + verification status + recent bookings + notifications
  - `useNurseBookings(nurseId)` - all booking requests with family info join
  - `useNurseAvailability(nurseId, weekStart)` - availability for a given week
  - `useMessagesInbox(userId)` - conversations grouped by booking with last message + unread count
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 47. **Build Nurse tab layout** (`(nurse)/_layout.tsx`)
  - Bottom TabBar with 5 tabs: Home (house), Bookings (calendar), Messages (message-square), Availability (clock), Profile (user)
  - Same styling as family tabs, badge support
  - _Requirements: 4.7_

- [ ] 48. **Build Nurse Dashboard Home** (`(nurse)/index.tsx`)
  - `VerificationStatusBanner` - full-width colored banner: pending (amber), under_review (brand), verified (green), rejected (red), resubmission (amber). Shows status text + actionable message.
  - `NotificationsPanel` - recent notifications (5 max), "View all" -> (future: dedicated notifications screen)
  - Recent bookings: FlatList of BookingCard (3 max), "View all" TextLink -> Bookings tab
  - Two CTA Buttons: "Edit profile" (secondary, outline), "Set availability" (secondary, outline)
  - _Requirements: 4.1_

- [ ] 49. **Build Nurse Profile Editor** (`(nurse)/profile.tsx`)
  - Scrollable form (ScreenWrapper + ScrollView):
    - Personal info: full_name, phone, region+city+barangay (RegionCitySelects), address
    - Professional: PRC license number Input, specializations Chip multi-select, years_experience Input, bio Textarea
    - Rates: hourly_rate range Input, daily_rate range Input
    - Documents: DocumentUploader for PRC/TESDA certificate, DocumentUploader for NBI clearance, profile photo upload
  - **Change detection**: Compare new documents against existing URLs. If different, set `verification_status` to `"pending"` + show confirmation alert "Your documents have changed and need re-verification."
  - "Save" Button -> upserts profiles + nurses tables, resets verification if docs changed
  - LoadingState while fetching, success toast on save
  - _Requirements: 4.2, Correctness Property 7_

- [ ] 50. **Build Nurse Bookings list** (`(nurse)/bookings/index.tsx`)
  - FlatList of BookingCard with pull-to-refresh
  - BookingCard: requested_date, shift label, status Badge, unread message count Badge
  - EmptyState: "No booking requests yet."
  - _Requirements: 4.4_

- [ ] 51. **Build Nurse Booking Detail** (`(nurse)/bookings/[id].tsx`)
  - Booking info header with status Badge
  - For `pending` bookings: Accept (primary, brand-600) and Decline (secondary, red outline) Buttons - triggers status update, creates notification for family
  - `BookingDetailCard` - parsed notes (reused component)
  - `MessageThread` - real-time chat (reused component)
  - _Requirements: 4.5, 7.1_

- [ ] 52. **Build Availability Calendar** (`(nurse)/availability.tsx`)
  - Week navigation row: "< Previous" TextLink | "Jun 8-14" label | "Next >" TextLink
  - `AvailabilityCalendar`:
    - 7 columns (Mon-Sun header row) x 3 shift rows (Morning/Afternoon/Evening)
    - Each cell: tappable toggle - open (brand-600 bg, white checkmark text) / closed (hairline border, muted dash text)
    - Past days: semi-transparent overlay, non-interactive
    - Current day: subtle ring border
  - "Save" Button -> bulk upsert availability rows via Supabase
  - LoadingState while fetching existing week's availability
  - _Requirements: 4.3_

- [ ] 53. **Build Nurse Messages Inbox** (`(nurse)/messages.tsx`)
  - `MessagesInbox` - FlatList of conversation cards grouped by booking
  - Each card: other party avatar (initial), full_name, last message preview (truncated), relative timestamp, unread count Badge
  - Tap -> navigates to `(nurse)/bookings/{bookingId}` and scrolls to MessageThread
  - EmptyState: "No messages yet."
  - Realtime updates: when new message arrives, conversation moves to top of inbox
  - _Requirements: 4.6, 7.3_

- [ ] 54. **Write tests for nurse dashboard**
  - Test: availability calendar toggles correctly and saves
  - Test: Accept/Decline booking updates status and creates notification
  - Test: profile editor detects document changes and resets verification
  - Test: MessagesInbox groups conversations with correct unread counts
  - _Requirements: Testing Strategy_

- [ ] 55. **Checkpoint - Nurse dashboard complete**
  - Verify: all 5 tabs render and navigate correctly
  - Verify: availability calendar saves, persists, and reflects in nurse detail (public)
  - Verify: Accept booking -> status updates + family sees change + notification created
  - Verify: profile editor saves all fields, document changes trigger re-verification
  - Verify: messages inbox groups conversations, real-time updates work
  - Verify: all tests pass
  - Ask the user if questions arise

### Phase 7: Admin Dashboard

**Goal**: Build the admin interface with verification workflow and management lists.

- [ ] 56. **Create data hooks for admin screens**
  - `useAdminMetrics()` - aggregate counts: pending verifications, under review, total bookings, total signups
  - **Architecture note**: Aggregate counts use Supabase `rpc()` calls (server-defined functions for performance) or direct `.count()` queries with caching, because mobile aggregate queries can be slow without server-side optimization
  - `useVerificationQueue(filter)` - paginated list of nurses by verification status with profile join
  - `useVerificationDetail(nurseId)` - nurse profile + documents + audit logs
  - `useAdminNurses(search)` - paginated nurse list with search
  - `useAdminFamilies(search)` - paginated family list with search
  - `useAdminBookings(filter, search)` - paginated booking list
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 57. **Build Admin layout** (`(admin)/_layout.tsx`)
  - Top tab bar or horizontal scrollable header tabs: Dashboard, Verifications, Nurses, Families, Bookings
  - Admin header row: admin name, Log Out Button
  - _Requirements: 5.5_

- [ ] 58. **Build Admin Dashboard Home** (`(admin)/index.tsx`)
  - 4 metric Cards in 2x2 grid (Card variant="default"), each with: count number (displayMd, bold), label (caption), brand accent left border
  - Quick actions section: "Review verifications" Card -> Verifications tab, "View all nurses" Card -> Nurses tab
  - Verification Status Legend: row of Badges with labels (Pending, Under Review, Verified, Rejected, Resubmission)
  - _Requirements: 5.1_

- [ ] 59. **Build Verification Queue** (`(admin)/verifications/index.tsx`)
  - SegmentedControl filter: All Active | Pending | Under Review | Approved | Rejected | Resubmission Required
  - FlatList of applicant Cards: avatar (initial), full_name, city, provider_type Badge, submission_date, verification_status Badge
  - Tap -> navigates to `(admin)/verifications/[id]`
  - EmptyState: "No applicants in this status."
  - _Requirements: 5.2_

- [ ] 60. **Build Verification Review screen** (`(admin)/verifications/[id].tsx`)
  - Section 1 - Applicant info: name, phone, email, address, provider type, specializations, submitted date
  - Section 2 - Document Viewer: `DocumentViewer` component (WebView-based PDF/image) for PRC document, TESDA document, NBI clearance. Swipeable or tabbed between docs.
  - Section 3 - Audit Log: FlatList of `verification_audit_logs` entries, each showing: admin name, action, previous_status -> new_status, timestamp
  - Section 4 - Action Buttons:
    - Approve (primary, brand-600) -> confirmation Alert -> status=verified, create audit log, notify nurse
    - Reject (secondary, red) -> shows rejection reason Input + confirmation Alert -> status=rejected
    - Request Resubmission (secondary) -> shows review notes Input -> status=resubmission_required
    - Mark Under Review (ghost) -> status=under_review
  - Each action: updates nurse.verification_status, inserts verification_audit_log row, creates notification for nurse
  - _Requirements: 5.3_

- [ ] 61. **Build Admin Management Lists**
  - `(admin)/nurses.tsx` - FlatList with search Input (debounced, 300ms), shows: avatar, full_name, city, verification_status Badge, provider_type Badge. Tap -> verification detail.
  - `(admin)/families.tsx` - FlatList with search, shows: full_name, patient_name, city. Tap -> profile detail.
  - `(admin)/bookings/index.tsx` - FlatList with status filter + search, shows: family_name, nurse_name, date, shift, status Badge. Tap -> booking detail.
  - `(admin)/bookings/[id].tsx` - Booking info, status Badge, "Mark completed" Button (admin override), BookingDetailCard, MessageThread in readOnly mode (no send input)
  - _Requirements: 5.4_

- [ ] 62. **Write tests for admin dashboard**
  - Test: verification queue filters by status
  - Test: Approve action updates status, creates audit log, sends notification
  - Test: admin management lists paginate correctly with search
  - _Requirements: Testing Strategy_

- [ ] 63. **Checkpoint - Admin dashboard complete**
  - Verify: metric cards show correct counts
  - Verify: verification queue filters and paginates correctly
  - Verify: approve/reject/resubmission flows work end-to-end (status, audit log, notification)
  - Verify: document viewer loads PDFs and images
  - Verify: nurse/family/booking lists load with search and pagination
  - Verify: all tests pass
  - Ask the user if questions arise

### Phase 8: Polish & Final Validation

**Goal**: Audit all states, verify accessibility, and run three complete user journeys end-to-end.

- [ ] 64. **Audit all screens for state coverage**
  - Every data-fetching screen: confirm LoadingState, ErrorState (with retry), and EmptyState are all implemented
  - Every FlatList: confirm `refreshControl` (pull-to-refresh) is wired
  - Every form: confirm KeyboardAvoidingView works, fields are accessible
  - Every interactive element: verify minimum 44x44pt touch target (use React DevTools inspector or manual audit)
  - _Requirements: 6.5, 6.6, Correctness Property 6_

- [ ] 65. **Accessibility audit**
  - Add `accessibilityLabel` to all icons and icon buttons
  - Add `accessibilityRole` to all interactive elements (button, header, image, text, etc.)
  - Verify color contrast: white text on brand-600/800/900 backgrounds meets WCAG AA (4.5:1 minimum)
  - Test VoiceOver (iOS) / TalkBack (Android) navigation through main flows
  - _Requirements: Accessibility Tests section_

- [ ] 66. **Run three complete user journeys end-to-end**
  - **Family journey**: Sign up -> Browse nurses -> View profile -> Request booking -> Chat with nurse -> Leave review
  - **Nurse journey**: Sign up -> Upload documents -> Set availability -> Accept booking -> Chat with family -> Receive review
  - **Admin journey**: Review verification -> Approve -> Verify nurse appears in public browse -> Monitor booking
  - Verify cross-role consistency at every step (nurse availability = family sees it, booking status = both parties see same state)
  - Throttle network to "Slow 3G" and verify all loading states render correctly
  - _Requirements: All_

- [ ] 67. **Final cleanup**
  - Remove unused imports and files
  - Verify `tsc --noEmit` passes with zero errors
  - Run complete test suite (`npm test`)
  - Review all Todo/FIXME comments left during implementation and resolve them
  - _Requirements: All_

- [ ] 68. **Checkpoint - Mobile app complete**
  - All 8 phases implemented and verified
  - All tests pass
  - Three complete user journeys validated end-to-end
  - TypeScript strict mode passes with zero errors
  - Ask the user if questions arise

## Notes

- Tasks referencing `_Requirements: all` cover general correctness properties (touch targets, state coverage, data consistency)
- The `MessageThread` component (Task 42) is built once and reused by family booking detail (Task 41), nurse booking detail (Task 51), and admin booking detail (Task 61 readOnly mode)
- The family "Browse" tab (Task 36) deep-links to `(public)/nurses/` rather than duplicating screens - confirm this works with `expo-router`'s `useRouter()` or `Link` component
- Admin aggregate metrics (Task 56) may require Supabase RPC functions for performance - plan for a small backend addition if direct `.count()` queries are too slow
- Follow Expo v54 docs at https://docs.expo.dev/versions/v54.0.0/ for any SDK-specific patterns
- The `AGENTS.md` in `apps/mobile/` reminds that Expo v54 has breaking changes from v52 - always reference versioned docs
