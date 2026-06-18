# Migration Guide: Monorepo Restructure

This guide explains the repository restructuring and how to migrate your local development environment.

## What Changed?

The repository was restructured from a single Next.js app to a monorepo supporting both web and future mobile development.

### Before
```
NurseLink/
├── app/              # Next.js routes
├── components/       # React components
├── lib/              # Utilities
├── supabase/         # Migrations
└── package.json
```

### After
```
NurseLink/
├── apps/
│   ├── web/          # All previous Next.js code moved here
│   └── mobile/       # Placeholder for future mobile app
├── packages/
│   ├── shared/       # Extracted business logic, types, validations
│   └── database/     # Supabase migrations
└── package.json      # Workspace configuration
```

## File Movements

| Old Location | New Location |
|--------------|--------------|
| `/app/**` | `/apps/web/app/**` |
| `/components/**` | `/apps/web/components/**` |
| `/lib/**` | `/apps/web/lib/**` (some moved to `packages/shared`) |
| `/supabase/**` | `/packages/database/supabase/**` |
| `/package.json` | `/apps/web/package.json` |
| Root configs (tsconfig, tailwind, etc.) | `/apps/web/` |

## Code That Moved to `packages/shared/`

The following were extracted to be shared between web and mobile:

- **Constants**: `lib/constants.ts` → `packages/shared/src/constants.ts`
- **Types**: Created new `packages/shared/src/types.ts`
- **Validations**: `lib/validations/*` → `packages/shared/src/validations/*`
- **Utilities**: Some from `lib/utils.ts` → `packages/shared/src/utils/index.ts`

## Migration Steps for Developers

### 1. Save Your Work

```bash
# Commit or stash any uncommitted changes
git add .
git commit -m "WIP: Before monorepo migration"
```

### 2. Pull Latest Changes

```bash
git pull origin main
```

### 3. Clean Install

```bash
# Remove old node_modules and lock file
rm -rf node_modules package-lock.json

# Install from workspace root
npm install
```

### 4. Update Environment Variables

Move `.env.local` to the web app directory:

```bash
mv .env.local apps/web/.env.local
```

Or create a new `apps/web/.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Update Your Scripts

**Old commands:**
```bash
npm run dev
npm run build
npm run lint
```

**New commands (from root):**
```bash
npm run dev          # Still works! Runs web app
npm run dev:web      # Explicit
npm run build        # Builds all workspaces
npm run build:web    # Build web only
npm run lint         # Lint all workspaces
```

**Or from web directory:**
```bash
cd apps/web
npm run dev
npm run build
```

### 6. Test the Application

```bash
# From root
npm run dev:web

# Verify at http://localhost:3000
```

### 7. Update Your IDE

If you use VS Code:

1. Open the root `NurseLink/` directory (not `apps/web`)
2. Install workspace-recommended extensions if prompted
3. TypeScript should automatically recognize the monorepo structure

## Import Path Changes

### Before

```typescript
import { APP_NAME } from '@/lib/constants';
import { loginSchema } from '@/lib/validations/auth';
import { cn } from '@/lib/utils';
```

### After (in apps/web)

Some imports now come from the shared package:

```typescript
// From shared package
import { APP_NAME } from '@hanapkalinga/shared/constants';
import { loginSchema } from '@hanapkalinga/shared/validations';
import type { UserRole, Booking } from '@hanapkalinga/shared/types';

// Web-specific utilities stay in lib
import { cn } from '@/lib/utils'; // Tailwind utility (web-only)
import { createClient } from '@/lib/supabase/server';
```

**Note:** Not all imports changed immediately. The `apps/web/lib` folder still contains web-specific code. Over time, more shared code will be migrated to `packages/shared`.

## Troubleshooting

### "Cannot find module '@hanapkalinga/shared'"

```bash
# Reinstall dependencies
npm install

# Or explicitly install the workspace
npm install --workspace=apps/web
```

### "Module not found: Can't resolve '@/lib/...'"

Make sure you're running commands from the correct directory. The `@/` alias points to the `apps/web/` root, not the monorepo root.

### TypeScript errors after migration

```bash
# Clear Next.js cache and TypeScript
cd apps/web
rm -rf .next
npx tsc --noEmit
```

### Build fails with "workspace" errors

Ensure you have npm 7+ (workspaces support):

```bash
npm --version  # Should be 9.x or higher
npm install -g npm@latest
```

## Benefits of the New Structure

1. **Shared Code**: Business logic, types, and validations can be reused in the mobile app
2. **Separation**: Clear boundaries between web, mobile, and shared code
3. **Independent Versioning**: Each app and package can be versioned separately
4. **Scalability**: Easy to add new apps (admin dashboard, API service, etc.)
5. **Cleaner Deploys**: Deploy only what changed (web or mobile)

## What's Next?

- Mobile app development in `apps/mobile/`
- More shared code extraction to `packages/shared/`
- Shared component patterns documentation
- CI/CD pipeline updates for monorepo

## Need Help?

If you encounter issues not covered here:

1. Check the main [README.md](./README.md)
2. Review package-specific READMEs:
   - [apps/web/README.md](./apps/web/README.md)
   - [packages/shared/README.md](./packages/shared/README.md)
   - [packages/database/README.md](./packages/database/README.md)
3. Contact the team

## Rollback (Emergency Only)

If critical issues arise, you can temporarily revert:

```bash
git checkout HEAD~1  # Go back one commit
npm install
npm run dev
```

Then report the issue so it can be fixed in the monorepo structure.
