# Implementation Plan: Mobile Design Alignment with Web

## Overview

A phased implementation that updates the mobile app's theme layer first, then UI components, then navigation, then screen layouts. Each phase builds on the previous, and checkpoints ensure visual correctness before proceeding.

## Tasks

### Phase 1: Theme Tokens & Dark Mode

- [x] 1. Update `apps/mobile/src/theme/colors.ts`
  - [x] Restructure from flat `colors` object to `{ light: ColorTokens, dark: ColorTokens }` matching web's `tokens.css`
  - [x] Add all missing web color tokens (primary, secondary, bg, surface, text, status, border, nav)
  - [x] Remove old brand blue palette
  - _Requirements: 1.1–1.10_

- [x] 2. Update `apps/mobile/src/theme/typography.ts`
  - [x] Replace Space Grotesk + Manrope with Plus Jakarta Sans (400, 500, 600, 700)
  - [x] Update font size scale to match web (base=16, sm=14, xs=12)
  - _Requirements: 2.1–2.4_

- [x] 3. Update `apps/mobile/src/theme/spacing.ts`
  - [x] Add full spacing scale matching web's Tailwind spacing
  - [x] Keep semantic aliases for convenience
  - _Requirements: 7.1–7.4_

- [x] 4. Update `apps/mobile/src/theme/rounded.ts`
  - [x] Set sm=4, md=14 (rounded-xl), lg=16 (rounded-2xl), pill=9999
  - _Requirements: 3.1–3.4_

- [x] 5. Create `apps/mobile/src/contexts/ThemeContext.tsx`
  - [x] Use `useColorScheme()` from React Native
  - [x] Provide `isDark` boolean and `colors` object (current mode's tokens)
  - [x] Wrap root layout
  - _Requirements: 6.1–6.6_

- [x] 6. Update `apps/mobile/app/_layout.tsx`
  - [x] Add ThemeProvider wrapping the app
  - [x] Replace Space Grotesk + Manrope font loading with Plus Jakarta Sans
  - [x] Remove old font imports and add `@expo-google-fonts/plus-jakarta-sans`
  - _Requirements: 2.1, 6.1_

- [x] 7. **Checkpoint — Theme Tokens Complete**
  - Verify all color keys from web's `tokens.css` exist in mobile's `colors.light` and `colors.dark`
  - Verify dark mode values match web's `html.dark` block
  - Ask the user if questions arise

### Phase 2: Core UI Components

- [x] 8. Redesign `apps/mobile/src/components/ui/Button.tsx`
  - Variants: `default`, `outline`, `ghost`, `destructive`
  - Sizes: `default` (h-11), `sm` (h-9), `lg` (h-12)
  - Styles: rounded-xl, teal primary, correct hover/active states
  - _Requirements: 4.1_

- [x] 9. Redesign `apps/mobile/src/components/ui/Card.tsx`
  - Remove signature/cream variants (unused after redesign)
  - Styles: rounded-2xl, border-border, bg-surface, p-4
  - _Requirements: 4.2_

- [x] 10. Redesign `apps/mobile/src/components/ui/Badge.tsx`
  - Colors: `neutral` (slate), `success` (emerald), `warning` (amber), `error` (rose), `info` (teal)
  - Styles: rounded-full, px-2.5 py-0.5, text-xs
  - Color hex values exactly matching web's badge patterns
  - _Requirements: 4.3_

- [x] 11. Redesign `apps/mobile/src/components/ui/Input.tsx`
  - Styles: rounded-xl, h-11, border-border, bg-surface, px-3
  - Focus: border-focus (teal)
  - Label: text-sm font-medium text-text-secondary
  - _Requirements: 4.4_

- [x] 12. Redesign `apps/mobile/src/components/ui/Chip.tsx`
  - Selected: teal border/bg/text
  - Unselected: slate border, white bg, slate text
  - Styles: rounded-full, py-0.5 px-3
  - _Requirements: 4.5_

- [x] 13. Redesign `apps/mobile/src/components/ui/Skeleton.tsx`
  - Styles: rounded-xl, bg-surface-alt, animate-pulse
  - Accept `width?`, `height?`, `style` props
  - _Requirements: 4.6_

- [x] 14. Create `apps/mobile/src/components/ui/ProfileAvatar.tsx`
  - Sizes: sm=44, md=64, lg=80
  - Styles: rounded-full, border-slate-200, bg-slate-100, text-slate-500
  - Show image, initials fallback, or User icon
  - _Requirements: 4.7_

- [x] 15. Redesign `apps/mobile/src/components/domain/StarRating.tsx`
  - Use Unicode filled ★ / empty ☆ in amber (#fbbf24)
  - Interactive with `value` and `onChange`
  - _Requirements: 4.9_

- [x] 16. Create `apps/mobile/src/components/ui/StarDisplay.tsx`
  - Non-interactive star display matching web's `StarDisplay`
  - Props: `rating`, `size` (sm | md)
  - Unicode ★/☆ in amber
  - _Requirements: 4.8_

- [x] 17. Create `apps/mobile/src/components/ui/EmptyState.tsx`
  - Match web's `EmptyState` component
  - Centered: icon in rounded-full bg-surface-alt, title, description, action
  - _Requirements: 7.6_

- [x] 18. **Checkpoint — UI Components Complete**
  - Verify each component renders with correct colors, radii, and typography
  - Spot-check against web equivalents
  - Ask the user if questions arise

### Phase 3: Navigation & Tab Bar

- [x] 19. Redesign `apps/mobile/src/components/navigation/TabBar.tsx`
  - Height: 64px, border-top nav-border, bg nav-bg
  - Active: filled icon, nav-active color, semibold 10px label
  - Inactive: unfilled icon, nav-inactive color, normal 10px label
  - Badge: absolute, bg-error, text-on-primary, max "9+"
  - _Requirements: 5.1–5.8_

- [x] 20. Update `apps/mobile/app/(family)/_layout.tsx`
  - Update tab bar styling to use new nav color tokens
  - Match tab order and labels to web's Family BottomNav (Home, Browse, Bookings, Messages, Profile)
  - _Requirements: 5.1–5.8_

- [x] 21. Update `apps/mobile/app/(nurse)/_layout.tsx`
  - Update tab bar styling to use new nav color tokens
  - Match tab order and labels to web's Nurse BottomNav (Home, Set Schedule, Bookings, Messages, Profile)
  - _Requirements: 5.1–5.8_

- [x] 22. **Checkpoint — Navigation Complete**
  - Verify tab bar matches web's BottomNav visually
  - Verify tab ordering and labels match web
  - Ask the user if questions arise

### Phase 4: Screen Layouts

- [x] 23. Update `apps/mobile/src/components/ScreenWrapper.tsx`
  - Background: use `bg` color from theme context instead of white canvas
  - _Requirements: 7.1_

- [x] 24. Redesign `apps/mobile/app/index.tsx` (Landing Screen)
  - Background: bg color
  - Brand name: teal primary, text-3xl, font-semibold
  - Tagline: text-text-secondary
  - Buttons: full-width, stacked, using new Button variants
  - _Requirements: 7.2_

- [x] 25. Redesign `apps/mobile/app/(auth)/login.tsx`
  - Background: bg color
  - Title: text-text-primary, matching web's heading style
  - Inputs: new Input component
  - Button: full-width teal primary
  - _Requirements: 7.2, 7.5_

- [x] 26. Redesign `apps/mobile/app/(family)/index.tsx` (Family Dashboard)
  - Background: bg
  - Cards: new Card component
  - Welcome banner: teal bg, white text
  - Section titles: correct typography
  - _Requirements: 7.3_

- [x] 27. Redesign `apps/mobile/app/(nurse)/index.tsx` (Nurse Dashboard)
  - Background: bg
  - Page title: correct typography
  - Verification banner: updated status colors
  - Booking cards: new Card component
  - _Requirements: 7.3_

- [x] 28. Update remaining screens to use new theme
  - `apps/mobile/app/(auth)/register/*.tsx`
  - `apps/mobile/app/(family)/bookings/*.tsx`
  - `apps/mobile/app/(family)/browse.tsx`
  - `apps/mobile/app/(family)/messages.tsx`
  - `apps/mobile/app/(family)/profile.tsx`
  - `apps/mobile/app/(nurse)/bookings/*.tsx`
  - `apps/mobile/app/(nurse)/availability.tsx`
  - `apps/mobile/app/(nurse)/messages.tsx`
  - `apps/mobile/app/(nurse)/profile.tsx`
  - `apps/mobile/app/(admin)/*.tsx`
  - `apps/mobile/app/(public)/*.tsx`
  - Update backgrounds, cards, buttons, badges to use new theme tokens
  - _Requirements: 7.1–7.6_

- [x] 29. Update `apps/mobile/src/components/BookingCard.tsx`
  - Match web's booking card styling
  - _Requirements: 7.3_

- [x] 30. Update `apps/mobile/src/components/BookingDetailCard.tsx`
  - Match web's `booking-details-card.tsx` styling
  - _Requirements: 7.3_

- [x] 31. **Checkpoint — Screen Layouts Complete**
  - Visually verify each major screen against its web counterpart
  - Verify all navigation flows still work
  - Verify dark mode on each screen
  - Ask the user if questions arise

## Notes

- Tasks are ordered by dependency: tokens → components → navigation → screens
- Each checkpoint requires user confirmation before proceeding to the next phase
- Tasks marked with `*` are lower priority and can be deferred
- All color hex values must be copied precisely from `apps/web/styles/tokens.css`
- The `NurseCard.tsx` domain component may need more extensive updates to match the web's richer layout — this is captured in the screen-level tasks
