# Requirements Document: Mobile Design Alignment with Web

## Introduction

Align the NurseLink mobile app (React Native / Expo) design system and component library to visually match the production web app (Next.js / Tailwind / shadcn/ui). The mobile app currently uses a blue brand palette and incomplete design tokens that diverge from the web's teal/navy system. This spec covers updating the theme tokens, UI components, screen layouts, and navigation to achieve visual parity while maintaining mobile-native UX patterns.

## Glossary

- **Design Token**: A named CSS/in-code variable representing a design decision (color, spacing, typography, radius).
- **Design System**: The complete set of reusable components, tokens, and patterns.
- **shadcn/ui**: The web UI component library used in the web app (New York style, Tailwind-based).
- **Expo Router 6**: File-based routing for React Native, similar to Next.js App Router.
- **Tab Bar**: Mobile bottom navigation bar (equivalent to web's `BottomNav`).
- **Dark Mode**: CSS class-based theme switching (`html.dark`) on web; to be mirrored on mobile.

## Requirements

### Requirement 1: Align Color Palette

**User Story:** As a user, I want the mobile app to use the same brand colors as the web app, so that the experience feels consistent across platforms.

#### Acceptance Criteria

1. WHEN the app renders in light mode, THEN the primary brand color SHALL be teal (#0d9488) with hover variant (#0f766e) and light variant (#ccfbf1).
2. WHEN the app renders in light mode, THEN the secondary color SHALL be navy (#1e3a5f) with soft variant (#2d5282).
3. WHEN the app renders in light mode, THEN the background colors SHALL be: bg (#f8fafb), surface (#ffffff), surface-alt (#f1f5f9).
4. WHEN the app renders in light mode, THEN the text colors SHALL be: primary (#1a202c), secondary (#4a5568), muted (#718096).
5. WHEN the app renders in light mode, THEN the status colors SHALL be: success (#059669), success-bg (#ecfdf5), success-border (#a7f3d0); warning (#d97706), warning-bg (#fffbeb), warning-border (#fde68a); error (#dc2626), error-bg (#fef2f2), error-border (#fecaca); info (#0d9488), info-bg (#ccfbf1), info-border (#99f6e4).
6. WHEN the app renders in light mode, THEN the border colors SHALL be: default (#e2e8f0), focus (#0d9488).
7. WHEN the app renders in light mode, THEN the nav colors SHALL be: bg (#ffffff), active (#0d9488), inactive (#94a3b8), border (#e2e8f0).
8. WHEN dark mode is active, THEN all colors SHALL switch to the dark variants defined in the web `tokens.css`.
9. THE color system SHALL use a `ThemeProvider` or React context to expose `isDark` throughout the app.
10. THE color tokens SHALL be exported as a single `colors` object with nested `light` and `dark` keys, keyed identical to the web's CSS custom properties.

### Requirement 2: Align Typography

**User Story:** As a user, I want the mobile app to use the same typeface and text sizing as the web app.

#### Acceptance Criteria

1. THE primary font SHALL be Plus Jakarta Sans (weights: 400, 500, 600, 700) — matching the web app's `--font-body`.
2. THE typography sizing SHALL match the web app: base text 16px, small 14px, extra-small 12px.
3. WHEN displaying headings (h1-h4), THEY SHALL use font-weight 600 (semibold) with the body font family.
4. The display font SHALL be removed (Space Grotesk) or replaced with Plus Jakarta Sans, since the web uses one font for all text.

### Requirement 3: Align Border Radii

**User Story:** As a user, I want consistent rounded corners across web and mobile.

#### Acceptance Criteria

1. THE default card/component border radius SHALL be `rounded-2xl` (1rem / 16px) — matching the web's Card component.
2. THE input/button border radius SHALL be `rounded-xl` (0.9rem / ~14px) — matching the web's Button and Input.
3. THE badge/pill border radius SHALL be `rounded-full` (9999px) — matching the web's Badge.
4. THE small element (skeleton, icon container) border radius SHALL be `rounded-xl` (0.9rem / ~14px) — matching the web's Skeleton.

### Requirement 4: Redesign UI Components

**User Story:** As a user, I want mobile UI components to visually match their web counterparts.

#### Acceptance Criteria

1. **Button**: WHEN rendered as `default` variant, IT SHALL have teal background (#0d9488), white text, rounded-xl (~14px), h-11 (44px) height. WHEN rendered as `outline` variant, IT SHALL have transparent bg, teal border, teal text. WHEN rendered as `ghost` variant, IT SHALL have transparent bg, teal text, teal hover bg. WHEN rendered as `destructive` variant, IT SHALL have error bg (#dc2626), white text.
2. **Card**: SHALL have rounded-2xl (16px) radius, border (1px solid #e2e8f0), bg-surface (#ffffff), p-4 (16px) padding.
3. **Badge**: SHALL be rounded-full with px-2.5 py-0.5 padding, text-xs font-medium. Color variants SHALL match the web's status patterns: `bg-slate-100 text-slate-700` for neutral, `bg-emerald-100 text-emerald-700` for success, `bg-amber-100 text-amber-700` for warning, `bg-rose-100 text-rose-700` for error.
4. **Input**: SHALL have rounded-xl (~14px), h-11 (44px), border-border, bg-surface, focus ring-2 ring-border-focus. Label SHALL be text-sm font-medium text-text-secondary.
5. **Chip / Filter Pill**: WHEN selected, SHALL use `border-brand-300 bg-brand-50 text-brand-700` (teal border/background/text). WHEN unselected, SHALL use `border-slate-200 bg-white text-slate-600`.
6. **Skeleton**: SHALL use `rounded-xl bg-surface-alt` with `animate-pulse`.
7. **Avatar**: SHALL be rounded-full, border border-slate-200, bg-slate-100, text-slate-500. Sizes: sm=44px, md=64px, lg=80px. SHALL show initials fallback or User icon.
8. **Star Display**: SHALL use `★` filled / `☆` empty characters in amber-400 (#fbbf24) color, matching web's `StarDisplay`.
9. **Star Rating**: SHALL use filled `★` / empty `☆` in amber-400, matching web's interactive `StarRating`.

### Requirement 5: Redesign Navigation (Tab Bar)

**User Story:** As a user, I want the mobile bottom tab bar to visually match the web's bottom navigation.

#### Acceptance Criteria

1. THE tab bar SHALL be fixed at the bottom with height 64px (h-16).
2. THE tab bar SHALL have border-top: 1px solid var(--color-nav-border).
3. THE tab bar background SHALL be `nav-bg` (#ffffff light, #162636 dark).
4. WHEN a tab is active, ITS icon SHALL use `nav-active` color (teal) with strokeWidth 2.25 and filled variant.
5. WHEN a tab is inactive, ITS icon SHALL use `nav-inactive` color (#94a3b8) with strokeWidth 2.
6. Tab labels SHALL be 10px font-size, centered below icons.
7. Active tab labels SHALL be font-semibold nav-active color. Inactive SHALL be font-normal nav-inactive color.
8. THE unread message badge SHALL be a red circle (bg-error), positioned at top-right of the Messages icon, showing count (max "9+").

### Requirement 6: Add Dark Mode Support

**User Story:** As a user, I want the mobile app to support dark mode matching the web app's dark theme.

#### Acceptance Criteria

1. WHEN the device is in dark mode, THE app SHALL automatically switch to dark color tokens.
2. THE dark color palette SHALL exactly match the web's `html.dark` token values (teal #14b8a6, navy #93c5fd, dark bg #0f1f2e, dark surface #162636, etc.).
3. ALL components (Button, Card, Badge, Input, TabBar, Skeleton, Avatar) SHALL respect the current theme context.
4. THE `ScreenWrapper` background SHALL switch between `bg` light/dark.
5. THE app SHALL use `useColorScheme()` from React Native to detect system preference.
6. A `ThemeContext` or similar SHALL provide `isDark` to all consumers.

### Requirement 7: Align Screen Layouts

**User Story:** As a user, I want mobile screen layouts to match the visual hierarchy and spacing of the web.

#### Acceptance Criteria

1. THE `ScreenWrapper` background SHALL be `bg` (not white canvas) — matching the web body's `bg-bg`.
2. Page-level padding SHALL use the spacing scale from the web (px-5 = 20px horizontal, py-10 for landing).
3. Dashboard pages SHALL use the same section spacing and card patterns as the web.
4. Forms SHALL use consistent label placement (text-sm font-medium text-text-secondary above inputs).
5. Empty states SHALL use the same pattern as web's `EmptyState`: centered icon in rounded circle (bg-surface-alt), title (text-base font-semibold text-text-primary), description (text-sm text-text-secondary), optional action button.

## Scope

### In-Spectrum
1. Update `apps/mobile/src/theme/colors.ts` to match web's tokens (light + dark)
2. Update `apps/mobile/src/theme/typography.ts` to use Plus Jakarta Sans
3. Update `apps/mobile/src/theme/spacing.ts` to match web's spacing scale
4. Update `apps/mobile/src/theme/rounded.ts` to match web's border radii
5. Redesign Button, Card, Badge, Input, Chip, Skeleton, Avatar, StarDisplay, StarRating components
6. Redesign TabBar to match web's BottomNav
7. Add dark mode support with ThemeContext
8. Update ScreenWrapper background
9. Update landing screen (index.tsx) to match web's home page design
10. Update login screen to match web's login page (teal branding, correct typography, layout)
11. Update family and nurse dashboard screens to use new tokens/layout
12. Update tab layouts to use new TabBar

### Out-of-Spectrum
1. Changing the routing structure or navigation logic (only visual styling)
2. Adding new screens or features (only aligning existing ones)
3. Changing the shared package types or validations
4. Modifying the web frontend (mobile-only changes)
5. Changing Supabase backend logic or API calls
6. Accessibility audit beyond what the web already provides

## Preservation Requirements

1. ALL existing functionality, navigation flows, and business logic SHALL remain unchanged.
2. ALL existing API calls, hooks, and data fetching SHALL remain unchanged.
3. ALL form validation schemas and submission logic SHALL remain unchanged.
4. The tab navigation structure (routes, auth guards) SHALL remain unchanged.
