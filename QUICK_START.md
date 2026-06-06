# Quick Start Guide

Get your restructured NurseLink monorepo up and running in 5 minutes.

## Prerequisites

- Node.js 18+ and npm 9+
- Your existing Supabase project
- Your existing `.env.local` file

## Step 1: Install Dependencies (2 minutes)

```bash
# Navigate to your project
cd "c:\Users\echob\OneDrive\Desktop\ghost project\NurseLink"

# Install all workspace dependencies
npm install
```

This will install dependencies for:
- Root workspace
- `apps/web` (your Next.js app)
- `packages/shared` (shared business logic)
- `packages/database` (no dependencies)

## Step 2: Set Up Environment Variables (1 minute)

Create `apps/web/.env.local` with your existing values:

```bash
# If you have an existing .env.local in the root, copy it:
copy .env.local apps\web\.env.local
```

Or create it manually:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Start Development Server (30 seconds)

```bash
# From the root directory
npm run dev:web

# Or navigate to apps/web first
cd apps\web
npm run dev
```

The app will be available at **http://localhost:3000**

## Step 4: Verify Everything Works (1 minute)

Test these key flows:

1. ✅ Home page loads
2. ✅ Login/Register pages work
3. ✅ Can create an account (if database is set up)
4. ✅ No console errors

## That's It! 🎉

Your web app is running from the new monorepo structure.

## What Changed?

Your code is now organized like this:

```
NurseLink/
├── apps/web/         ← Your Next.js app lives here now
├── packages/shared/  ← Shared code (ready for mobile)
└── packages/database/← Database migrations
```

## Next Steps (Optional)

### 1. Update Import Paths (Recommended)

Some imports can be updated to use the shared package:

```typescript
// Before
import { APP_NAME } from '@/lib/constants';

// After
import { APP_NAME } from '@hanapkalinga/shared/constants';
```

See [IMPORT_UPDATE_GUIDE.md](./IMPORT_UPDATE_GUIDE.md) for details.

### 2. Explore the New Structure

```bash
# Check out the shared package
cd packages\shared\src
dir

# See the database migrations
cd ..\..\..\packages\database\supabase\migrations
dir
```

### 3. Read the Documentation

- [README.md](./README.md) - Full documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture overview
- [RESTRUCTURE_SUMMARY.md](./RESTRUCTURE_SUMMARY.md) - What changed

## Common Commands

```bash
# Development
npm run dev              # Start web app
npm run dev:web          # Start web app (explicit)

# Building
npm run build            # Build all apps
npm run build:web        # Build web only

# Linting
npm run lint             # Lint all workspaces

# Cleaning
npm run clean            # Remove all node_modules and builds
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules apps/web/node_modules packages/*/node_modules
npm install
```

### TypeScript Errors

```bash
cd apps\web
rm -rf .next
npm run build
```

## Need Help?

- Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- Review [ARCHITECTURE.md](./ARCHITECTURE.md)
- See the main [README.md](./README.md)

## Ready for Mobile?

When you're ready to add the mobile app:

1. Choose React Native with Expo
2. Set up in `apps/mobile/`
3. Use `@hanapkalinga/shared` for business logic
4. Build native UI components

See [apps/mobile/README.md](./apps/mobile/README.md) for more.

---

**You're all set!** Your monorepo is ready for web and future mobile development. 🚀
