# HanapKalinga

Mobile-first marketplace platform for connecting Filipino families with verified private duty nurses and caregivers.

## Repository Structure

This is a **monorepo** containing both web and mobile applications with shared code:

```
NurseLink/
├── apps/
│   ├── web/              # Next.js web application
│   └── mobile/           # React Native mobile app (coming soon)
├── packages/
│   ├── shared/           # Shared business logic, types, validations
│   ├── database/         # Supabase migrations and seeds
│   └── config/           # Shared configurations (future)
└── package.json          # Workspace root
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- A Supabase project ([create one here](https://supabase.com))

### Installation

```bash
# Install all dependencies (web + shared packages)
npm install

# Start web development server
npm run dev

# Or specifically run the web app
npm run dev:web
```

The web app will be available at `http://localhost:3000`

## Environment Variables

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Supabase Setup

1. Create a new Supabase project
2. Enable Email auth with OTP for signup and password sign-in
3. Add redirect URLs in Supabase Auth settings:
   - Site URL: your production URL
   - Redirect URLs: `http://localhost:3000/auth/callback`, production callback URL
4. Run migrations from `packages/database/supabase/migrations/` in order (includes `0008_nurse_docs_storage_policies.sql` for document upload RLS)
5. Or create the `nurse-docs` bucket manually only if you skip migration 0008 — it must be **private** with storage policies allowing authenticated uploads to `{user_id}/*`
6. Run `packages/database/supabase/seed.sql` to create admin account

### Seeded Admin Credentials

- Email: `admin@hanapkalinga.ph`
- Password: `ChangeMe123!`

⚠️ **Change this password immediately after first login!**

## Development

### Web App

```bash
# From root
npm run dev:web

# Or from apps/web/
cd apps/web
npm run dev
```

### Mobile App

_Coming soon - React Native/Expo setup will be added_

### Build All

```bash
# Build all apps
npm run build

# Build only web
npm run build:web
```

### Linting

```bash
# Lint all workspaces
npm run lint

# Lint specific workspace
npm run lint --workspace=apps/web
```

## Architecture

### Shared Code (`packages/shared/`)

Business logic that works across web and mobile:
- **Constants**: App name, specializations, cities
- **Types**: TypeScript interfaces for database models
- **Validations**: Zod schemas for forms
- **Utils**: Date formatting, currency, helpers
- **API Config**: Supabase client setup

### Platform-Specific Code

- **Web** (`apps/web/`): Next.js 14 with App Router, shadcn/ui components
- **Mobile** (`apps/mobile/`): Future React Native app with native components

**Key Principle:** UI is separate, business logic is shared.

## Tech Stack

### Web
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Supabase (Auth, Database, Storage)
- Zustand (state management)
- React Hook Form + Zod

### Mobile (Planned)
- React Native with Expo
- TypeScript
- Supabase
- Native Navigation
- NativeWind or React Native Paper

### Shared
- TypeScript
- Zod validation
- Supabase client

## Project Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web dev server |
| `npm run dev:web` | Start web dev server (explicit) |
| `npm run build` | Build all apps |
| `npm run build:web` | Build web app only |
| `npm run lint` | Lint all workspaces |
| `npm run clean` | Remove all node_modules and build artifacts |

## Features

### For Families
- Browse and filter verified nurses/caregivers
- Book nurses by date and shift
- Real-time messaging with providers
- Review and rate nurses post-booking
- Manage family profile and patient information

### For Nurses/Caregivers
- Create professional profile with credentials
- Upload PRC license, TESDA certificate, NBI clearance
- Set availability by date and shift
- Accept/decline booking requests
- Message families
- View booking history and reviews

### For Admins
- Verify nurse credentials (PRC, TESDA, NBI)
- Manage users (families and providers)
- Oversee all bookings
- Platform moderation

## Contributing

1. Create a feature branch
2. Make your changes in the appropriate workspace (`apps/web`, `packages/shared`, etc.)
3. Test thoroughly
4. Submit a pull request

## License

Private project - All rights reserved

## Support

For questions or issues, contact: support@hanapkalinga.ph
