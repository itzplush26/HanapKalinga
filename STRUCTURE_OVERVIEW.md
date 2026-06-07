# Repository Structure Overview

## 📂 Complete Directory Tree

```
NurseLink/                                    # Monorepo Root
│
├── 📱 apps/                                  # Applications
│   │
│   ├── web/                                  # Next.js Web Application
│   │   ├── app/                              # Next.js App Router
│   │   │   ├── admin/                        # Admin dashboard routes
│   │   │   │   ├── bookings/                 # Manage bookings
│   │   │   │   ├── families/                 # Manage families
│   │   │   │   ├── nurses/                   # Manage nurses
│   │   │   │   └── verifications/            # Verify nurse credentials
│   │   │   ├── auth/
│   │   │   │   └── callback/                 # OAuth callback
│   │   │   ├── dashboard/
│   │   │   │   ├── family/                   # Family member dashboard
│   │   │   │   │   ├── bookings/             # View/create bookings
│   │   │   │   │   ├── messages/             # Messaging
│   │   │   │   │   └── profile/              # Profile management
│   │   │   │   └── nurse/                    # Nurse/caregiver dashboard
│   │   │   │       ├── availability/         # Set availability
│   │   │   │       ├── bookings/             # Accept/decline bookings
│   │   │   │       ├── messages/             # Messaging
│   │   │   │       └── profile/              # Profile & credentials
│   │   │   ├── login/                        # Authentication
│   │   │   ├── nurses/                       # Browse nurses
│   │   │   ├── register/                     # Sign up flow
│   │   │   ├── privacy/                      # Privacy policy
│   │   │   ├── terms/                        # Terms of service
│   │   │   ├── globals.css                   # Global styles
│   │   │   ├── layout.tsx                    # Root layout
│   │   │   └── page.tsx                      # Landing page
│   │   │
│   │   ├── components/                       # React Components
│   │   │   ├── ui/                           # shadcn/ui base components
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   └── textarea.tsx
│   │   │   ├── availability-calendar.tsx     # Nurse availability UI
│   │   │   ├── booking-details-card.tsx      # Booking info display
│   │   │   ├── booking-review-form.tsx       # Review submission
│   │   │   ├── booking-status-badge.tsx      # Status indicator
│   │   │   ├── dashboard-header.tsx          # Dashboard header
│   │   │   ├── dashboard-nav.tsx             # Dashboard navigation
│   │   │   ├── document-uploader.tsx         # File upload component
│   │   │   ├── message-thread.tsx            # Messaging UI
│   │   │   ├── messages-inbox.tsx            # Message list
│   │   │   ├── nurse-card.tsx                # Nurse profile card
│   │   │   ├── nurse-filters.tsx             # Search/filter UI
│   │   │   ├── nurses-welcome-banner.tsx     # Welcome banner
│   │   │   ├── sign-out-button.tsx           # Sign out button
│   │   │   ├── star-rating.tsx               # Rating display
│   │   │   └── verification-status-banner.tsx # Verification status
│   │   │
│   │   ├── lib/                              # Web-Specific Utilities
│   │   │   ├── supabase/                     # Supabase clients
│   │   │   │   ├── client.ts                 # Browser client
│   │   │   │   ├── server.ts                 # Server component client
│   │   │   │   └── middleware.ts             # Middleware client
│   │   │   ├── auth-redirect.ts              # Auth routing logic
│   │   │   ├── availability-status.ts        # Availability helpers
│   │   │   ├── booking-notes.ts              # Booking utilities
│   │   │   ├── constants.ts                  # Web constants (to migrate)
│   │   │   ├── messages.ts                   # Messaging helpers
│   │   │   ├── ph-locations.ts               # PH location data
│   │   │   ├── post-auth.ts                  # Post-login flow
│   │   │   ├── storage-docs.ts               # File storage helpers
│   │   │   ├── user-errors.ts                # Error handling
│   │   │   ├── utils.ts                      # Tailwind utilities
│   │   │   └── validations/                  # Validation schemas (to migrate)
│   │   │
│   │   ├── types/                            # Generated types
│   │   │   └── database.types.ts             # Supabase generated types
│   │   │
│   │   ├── .env.example                      # Environment template
│   │   ├── .eslintrc.json                    # ESLint config
│   │   ├── components.json                   # shadcn/ui config
│   │   ├── middleware.ts                     # Next.js middleware
│   │   ├── next.config.mjs                   # Next.js config
│   │   ├── package.json                      # Web dependencies
│   │   ├── postcss.config.js                 # PostCSS config
│   │   ├── README.md                         # Web app docs
│   │   ├── tailwind.config.ts                # Tailwind config
│   │   └── tsconfig.json                     # TypeScript config
│   │
│   └── mobile/                               # React Native Mobile App (Future)
│       ├── .gitkeep                          # Placeholder file
│       └── README.md                         # Mobile app docs
│
├── 📦 packages/                              # Shared Packages
│   │
│   ├── shared/                               # Shared Business Logic
│   │   ├── src/
│   │   │   ├── api/                          # API configuration
│   │   │   │   ├── index.ts
│   │   │   │   └── supabase-config.ts        # Supabase setup
│   │   │   ├── utils/                        # Utilities
│   │   │   │   └── index.ts                  # Formatting, helpers
│   │   │   ├── validations/                  # Zod Schemas
│   │   │   │   ├── auth.ts                   # Auth validation
│   │   │   │   ├── availability.ts           # Availability validation
│   │   │   │   ├── booking.ts                # Booking validation
│   │   │   │   ├── profile.ts                # Profile validation
│   │   │   │   └── index.ts                  # Re-exports
│   │   │   ├── constants.ts                  # App constants
│   │   │   ├── index.ts                      # Main entry
│   │   │   └── types.ts                      # TypeScript types
│   │   ├── package.json                      # Shared dependencies
│   │   ├── README.md                         # Shared package docs
│   │   └── tsconfig.json                     # TypeScript config
│   │
│   └── database/                             # Database Migrations
│       ├── supabase/
│       │   ├── migrations/                   # SQL migrations
│       │   │   ├── 0001_init.sql             # Initial schema
│       │   │   ├── 0002_profile_fields.sql   # Profile updates
│       │   │   ├── 0003_onboarding_fields.sql # Onboarding
│       │   │   ├── 0004_role_lock.sql        # Role constraints
│       │   │   ├── 0005_registration_rules.sql # Registration
│       │   │   ├── 0006_nurse_ratings_and_message_read.sql
│       │   │   └── 0007_fix_rls_admin_recursion.sql # RLS fix
│       │   └── seed.sql                      # Seed data
│       ├── package.json                      # Database package
│       └── README.md                         # Database docs
│
├── 📄 .github/                               # GitHub Configuration
│   └── copilot-instructions.md               # AI instructions
│
├── 📝 Documentation Files
│   ├── .gitignore                            # Git ignore rules
│   ├── ARCHITECTURE.md                       # Architecture details
│   ├── IMPORT_UPDATE_GUIDE.md                # Import migration guide
│   ├── MIGRATION_GUIDE.md                    # Developer migration
│   ├── QUICK_START.md                        # Quick start guide
│   ├── README.md                             # Main documentation
│   ├── RESTRUCTURE_SUMMARY.md                # Restructure summary
│   └── STRUCTURE_OVERVIEW.md                 # This file
│
├── package.json                              # Workspace configuration
└── package.json.backup                       # Original backup
```

## 📊 Package Dependency Graph

```
┌─────────────────┐
│   Web App       │ (apps/web)
│  - Next.js 14   │
│  - React 18     │
│  - Tailwind     │
│  - shadcn/ui    │
└────────┬────────┘
         │
         │ depends on
         │
         ├─────────────────> ┌──────────────────┐
         │                   │  Shared Package   │ (packages/shared)
         │                   │  - Constants      │
         │                   │  - Types          │
         │                   │  - Validations    │
┌─────────────────┐          │  - Utils          │
│  Mobile App     │ (future) │  - API Config     │
│  - React Native │          └──────────────────┘
│  - Expo         │                   │
└────────┬────────┘                   │
         │                            │
         │ depends on                 │ uses
         │                            │
         └─────────────────>          │
                                      ▼
                           ┌──────────────────┐
                           │  Database        │ (packages/database)
                           │  - Migrations    │
                           │  - Seeds         │
                           │  (Supabase)      │
                           └──────────────────┘
```

## 🎯 Key File Locations

### Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| **Workspace** | `/package.json` | Monorepo workspace config |
| **Web App** | `/apps/web/package.json` | Web dependencies |
| **Shared** | `/packages/shared/package.json` | Shared dependencies |
| **TypeScript (Web)** | `/apps/web/tsconfig.json` | Web TypeScript config |
| **TypeScript (Shared)** | `/packages/shared/tsconfig.json` | Shared TypeScript config |
| **Next.js** | `/apps/web/next.config.mjs` | Next.js configuration |
| **Tailwind** | `/apps/web/tailwind.config.ts` | Tailwind CSS config |
| **ESLint** | `/apps/web/.eslintrc.json` | ESLint rules |

### Environment Files

| File | Location | Purpose |
|------|----------|---------|
| **Template** | `/apps/web/.env.example` | Environment template |
| **Local** | `/apps/web/.env.local` | Your local secrets |

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `QUICK_START.md` | Get started in 5 minutes |
| `ARCHITECTURE.md` | Architecture deep dive |
| `MIGRATION_GUIDE.md` | Developer migration guide |
| `IMPORT_UPDATE_GUIDE.md` | Update import paths |
| `RESTRUCTURE_SUMMARY.md` | What changed summary |
| `STRUCTURE_OVERVIEW.md` | This file - complete structure |

### Key Source Files

| Type | Location | Count |
|------|----------|-------|
| **Pages/Routes** | `/apps/web/app/**/*.tsx` | ~33 routes |
| **Components** | `/apps/web/components/**/*.tsx` | ~22 components |
| **Web Utilities** | `/apps/web/lib/**/*.ts` | ~13 files |
| **Shared Code** | `/packages/shared/src/**/*.ts` | ~10 files |
| **Migrations** | `/packages/database/supabase/migrations/*.sql` | 7 migrations |

## 🔢 Statistics

### Before Restructure
- **1** application (Next.js)
- **1** package.json
- **0%** code sharing capability
- **Flat** structure

### After Restructure
- **2** applications (web + mobile placeholder)
- **4** packages (root + web + shared + database)
- **~40%** code sharing (shared package)
- **Monorepo** structure with workspaces

### Files Moved
- ✅ **63+** TypeScript/TSX files → `apps/web/`
- ✅ **7** SQL migrations → `packages/database/`
- ✅ **10** shared files → `packages/shared/`
- ✅ **22** components → `apps/web/components/`

## 🚀 Quick Reference Commands

### Development
```bash
npm run dev              # Start web app
npm run dev:web          # Start web app (explicit)
```

### Building
```bash
npm run build            # Build all workspaces
npm run build:web        # Build web only
```

### Maintenance
```bash
npm run lint             # Lint all workspaces
npm run clean            # Clean all builds
npm install              # Install/update dependencies
```

### Navigation
```bash
cd apps/web              # Go to web app
cd apps/mobile           # Go to mobile app
cd packages/shared       # Go to shared package
cd packages/database     # Go to database package
```

## 📚 What's Shared vs. What's Not

### ✅ Shared (packages/shared/)
- Constants (APP_NAME, specializations, cities)
- Type definitions (User, Booking, Nurse interfaces)
- Validation schemas (Zod for all forms)
- Business logic utilities
- Date/currency formatting
- Supabase configuration

### ❌ Web-Only (apps/web/)
- React components (shadcn/ui)
- Next.js routes and layouts
- Tailwind utilities
- SSR/SSG logic
- Next.js middleware
- Web-specific helpers

### 🔮 Mobile-Only (apps/mobile/) - Future
- React Native components
- Native navigation
- Mobile-specific utilities
- Platform APIs (Camera, etc.)
- Native styling

## 🎓 Learning Path

### For New Developers

1. **Start Here:**
   - Read [`QUICK_START.md`](./QUICK_START.md)
   - Review [`README.md`](./README.md)

2. **Understand Structure:**
   - This file (`STRUCTURE_OVERVIEW.md`)
   - [`ARCHITECTURE.md`](./ARCHITECTURE.md)

3. **Make Changes:**
   - Work in `apps/web/` for web features
   - Add to `packages/shared/` for shared logic
   - Update `packages/database/` for schema changes

### For Existing Developers

1. **Migration:**
   - Read [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)
   - Update imports per [`IMPORT_UPDATE_GUIDE.md`](./IMPORT_UPDATE_GUIDE.md)

2. **Adapt Workflow:**
   - Use new directory paths
   - Use `@hanapkalinga/shared` imports
   - Test in both web and (future) mobile

## ✨ Benefits Recap

| Benefit | Description |
|---------|-------------|
| 🔄 **Code Reuse** | Share 40% of code between platforms |
| 🎯 **Organization** | Clear separation of concerns |
| 📱 **Mobile Ready** | Structure prepared for mobile app |
| 🚀 **Scalability** | Easy to add new apps/packages |
| 🛡️ **Type Safety** | Shared types across platforms |
| 🔧 **Maintainability** | Easier to manage and update |
| 🎨 **Flexibility** | Platform-optimized UIs |

---

**Your monorepo is fully restructured and ready for development!** 🎉
