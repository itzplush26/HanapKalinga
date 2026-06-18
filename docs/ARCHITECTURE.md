# Architecture Overview

## Monorepo Structure

```
NurseLink/
├── apps/
│   ├── web/                      # Next.js web application
│   │   ├── app/                  # Next.js App Router pages
│   │   ├── components/           # React components (shadcn/ui)
│   │   ├── lib/                  # Web-specific utilities
│   │   │   ├── supabase/         # Supabase clients (Next.js-specific)
│   │   │   ├── utils.ts          # Tailwind utilities (web-only)
│   │   │   ├── auth-redirect.ts  # Web routing logic
│   │   │   └── ...               # Other web helpers
│   │   ├── types/                # Generated Supabase types
│   │   └── package.json          # Web app dependencies
│   │
│   └── mobile/                   # React Native mobile app (future)
│       ├── src/                  # Mobile app source
│       ├── components/           # Native components
│       └── package.json          # Mobile dependencies
│
├── packages/
│   ├── shared/                   # Shared business logic
│   │   ├── src/
│   │   │   ├── constants.ts      # App constants
│   │   │   ├── types.ts          # TypeScript interfaces
│   │   │   ├── validations/      # Zod schemas
│   │   │   ├── utils/            # Platform-agnostic utilities
│   │   │   └── api/              # Supabase config
│   │   └── package.json
│   │
│   └── database/                 # Database migrations & seeds
│       ├── supabase/
│       │   ├── migrations/       # SQL migration files
│       │   └── seed.sql          # Seed data
│       └── package.json
│
└── package.json                  # Workspace root configuration
```

## Package Dependencies

```
┌─────────────┐
│   Web App   │──────┐
└─────────────┘      │
                     ├──────> ┌─────────────┐
┌─────────────┐      │        │   Shared    │
│  Mobile App │──────┤        │   Package   │
└─────────────┘      │        └─────────────┘
                     │              │
                     │              ├──────> Supabase
                     │              ├──────> Zod
                     │              └──────> TypeScript
                     │
                     └──────> ┌─────────────┐
                              │  Database   │
                              │   Package   │
                              └─────────────┘
                                    │
                                    └──────> Supabase (migrations)
```

## Code Sharing Strategy

### ✅ Shared Between Web & Mobile

**Location:** `packages/shared/`

- **Business Logic**: Calculations, data transformations
- **Constants**: App name, specializations, cities, regions
- **Types**: User, Booking, Nurse, Family interfaces
- **Validations**: Zod schemas for forms
- **Utilities**: Date formatting, currency, helpers
- **API Config**: Supabase connection setup

**Example:**
```typescript
// packages/shared/src/constants.ts
export const APP_NAME = "HanapKalinga";
export const PROVIDER_SPECIALIZATIONS = [...];
```

### ❌ Platform-Specific Code

**Web Only** (`apps/web/`):
- React components using shadcn/ui
- Next.js Server Components
- Tailwind CSS utilities
- Next.js routing & middleware
- SSR/SSG logic

**Mobile Only** (`apps/mobile/`):
- React Native components
- Native navigation
- Platform-specific APIs (Camera, Location, etc.)
- React Native styling

### 📊 Database

**Location:** `packages/database/`

- SQL migrations (shared schema)
- Seed data
- No code dependencies

## Data Flow

### Web Application

```
User Request
    ↓
Next.js Route (apps/web/app/)
    ↓
React Component (apps/web/components/)
    ↓
Form Validation (packages/shared/validations/)
    ↓
Supabase Client (apps/web/lib/supabase/)
    ↓
Database (packages/database/)
    ↓
Response with Types (packages/shared/types/)
    ↓
UI Rendering
```

### Mobile Application (Future)

```
User Action
    ↓
React Native Screen
    ↓
Native Component (apps/mobile/components/)
    ↓
Form Validation (packages/shared/validations/)
    ↓
Supabase Client (apps/mobile/lib/supabase/)
    ↓
Database (packages/database/)
    ↓
Response with Types (packages/shared/types/)
    ↓
UI Rendering
```

## Import Examples

### Web App Imports

```typescript
// From shared package
import { APP_NAME, PROVIDER_SPECIALIZATIONS } from '@hanapkalinga/shared/constants';
import { loginSchema, nurseProfileSchema } from '@hanapkalinga/shared/validations';
import { formatCurrency, formatDate } from '@hanapkalinga/shared/utils';
import type { UserRole, Booking, Nurse } from '@hanapkalinga/shared/types';

// Web-specific imports
import { createClient } from '@/lib/supabase/server'; // Next.js SSR client
import { cn } from '@/lib/utils'; // Tailwind utility
import { Button } from '@/components/ui/button'; // shadcn component
```

### Mobile App Imports (Future)

```typescript
// From shared package (same as web!)
import { APP_NAME, PROVIDER_SPECIALIZATIONS } from '@hanapkalinga/shared/constants';
import { loginSchema } from '@hanapkalinga/shared/validations';
import { formatCurrency } from '@hanapkalinga/shared/utils';
import type { UserRole, Booking } from '@hanapkalinga/shared/types';

// Mobile-specific imports
import { createClient } from '@/lib/supabase/client'; // React Native client
import { Button, Text } from 'react-native'; // Native components
import { MyButton } from '@/components/Button'; // Custom native component
```

## Build & Deploy Strategy

### Local Development

```bash
# Web development
npm run dev:web

# Mobile development (future)
npm run dev:mobile

# Run both (future)
npm run dev
```

### Production Build

```bash
# Build all apps
npm run build

# Build specific app
npm run build:web
npm run build:mobile
```

### Deployment

**Web App:**
- Deploy `apps/web/` to Vercel/Netlify
- Environment variables in web platform
- Automatic builds on git push

**Mobile App (Future):**
- Build with Expo or React Native CLI
- Submit to App Store / Play Store
- Over-the-air updates with Expo

**Database:**
- Migrations applied to Supabase project
- Same database for web and mobile
- RLS policies protect data

## Tech Stack Summary

### Web (`apps/web/`)
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + shadcn/ui |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| State | Zustand |
| Backend | Supabase |

### Mobile (`apps/mobile/`) - Planned
| Layer | Technology |
|-------|------------|
| Framework | React Native + Expo |
| UI | React Native components |
| Styling | NativeWind / RN Paper |
| Navigation | React Navigation |
| Forms | React Hook Form + Zod |
| State | Zustand / React Query |
| Backend | Supabase |

### Shared (`packages/shared/`)
| Layer | Technology |
|-------|------------|
| Language | TypeScript |
| Validation | Zod |
| API Client | Supabase JS |
| Utils | Pure JavaScript/TypeScript |

### Database (`packages/database/`)
| Layer | Technology |
|-------|------------|
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |

## Benefits of This Architecture

1. **Code Reuse**: ~40% of codebase shared between web and mobile
2. **Type Safety**: Shared types ensure consistency
3. **Single Source of Truth**: Constants, validations defined once
4. **Platform Optimization**: Each UI can be optimized for its platform
5. **Independent Deployment**: Deploy web without affecting mobile
6. **Scalability**: Easy to add new apps (admin dashboard, etc.)
7. **Maintainability**: Clear boundaries between packages

## Future Additions

- `packages/config/` - Shared ESLint, TypeScript configs
- `packages/ui-web/` - Extract reusable web components
- `packages/ui-mobile/` - Extract reusable mobile components
- `apps/admin/` - Separate admin dashboard
- `apps/api/` - Standalone API service

## Conventions

### Naming
- Packages: `@hanapkalinga/[name]`
- Apps: descriptive names (web, mobile, admin)
- Imports: Use workspace names in package.json

### File Structure
- `src/` for all source code in packages
- `app/` for Next.js routes
- `components/` for React components
- `lib/` for utilities and helpers

### TypeScript
- Strict mode enabled
- Shared types in `packages/shared/src/types.ts`
- No `any` types (use `unknown` if needed)

### Testing (Future)
- Unit tests in `__tests__/` folders
- E2E tests in dedicated `tests/` directories
- Shared tests can be in `packages/shared/`

## Questions?

See also:
- [README.md](./README.md) - Getting started
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migrating from old structure
- [IMPORT_UPDATE_GUIDE.md](./IMPORT_UPDATE_GUIDE.md) - Updating imports
