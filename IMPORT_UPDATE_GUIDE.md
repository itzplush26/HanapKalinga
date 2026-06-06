# Import Update Guide

After the monorepo restructure, some imports need to be updated to use the shared package.

## What Needs to Change

### ✅ Use Shared Package For:

1. **Constants** - `@/lib/constants` → `@hanapkalinga/shared/constants`
2. **Validations** - `@/lib/validations/*` → `@hanapkalinga/shared/validations`
3. **Types** - Create new imports from `@hanapkalinga/shared/types`

### ❌ Keep in apps/web/lib For:

1. **Supabase clients** - `@/lib/supabase/*` (web-specific, uses Next.js)
2. **Web utilities** - `@/lib/utils` (uses Tailwind, web-only)
3. **Auth redirects** - `@/lib/auth-redirect` (web-specific routing)
4. **Other web helpers** - All other files in `apps/web/lib`

## Search & Replace Guide

Use your IDE's "Find and Replace in Files" feature:

### 1. Update Constants Imports

**Find:** `from "@/lib/constants"`  
**Replace with:** `from "@hanapkalinga/shared/constants"`

**Affected files:**
- `apps/web/app/register/page.tsx`
- `apps/web/app/login/page.tsx`
- `apps/web/app/dashboard/family/bookings/new/page.tsx`
- `apps/web/lib/ph-locations.ts`

### 2. Update Validation Imports

**Find:** `from "@/lib/validations/auth"`  
**Replace with:** `from "@hanapkalinga/shared/validations"`

**Find:** `from "@/lib/validations/profile"`  
**Replace with:** `from "@hanapkalinga/shared/validations"`

**Find:** `from "@/lib/validations/booking"`  
**Replace with:** `from "@hanapkalinga/shared/validations"`

**Find:** `from "@/lib/validations/availability"`  
**Replace with:** `from "@hanapkalinga/shared/validations"`

**Affected files:**
- `apps/web/app/register/page.tsx`
- `apps/web/app/login/page.tsx`
- `apps/web/app/login/update-password/page.tsx`
- `apps/web/app/login/forgot-password/page.tsx`
- `apps/web/app/dashboard/family/bookings/new/page.tsx`
- `apps/web/app/dashboard/family/profile/page.tsx`
- `apps/web/app/dashboard/nurse/profile/page.tsx`
- `apps/web/app/dashboard/nurse/availability/page.tsx`

### 3. Update PH Locations Import

The `PH_CITIES` and `PH_REGIONS` constants are now in the shared package:

**Find:** `from "@/lib/ph-locations"`  
**Replace with:** `from "@hanapkalinga/shared/constants"`

Then update the import names:
```typescript
// Old
import { PH_CITIES } from "@/lib/ph-locations";

// New
import { PH_CITIES } from "@hanapkalinga/shared/constants";
```

### 4. Add Type Imports

For files that use database types, add:

```typescript
import type { UserRole, Booking, Nurse, Profile } from "@hanapkalinga/shared/types";
```

## Automated Update (Optional)

You can run these commands from `apps/web/` to update imports automatically:

**Note:** Test thoroughly after running these!

```bash
# Update constants imports
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/@\/lib\/constants/@hanapkalinga\/shared\/constants/g'

# Update validation imports - auth
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/@\/lib\/validations\/auth/@hanapkalinga\/shared\/validations/g'

# Update validation imports - profile
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/@\/lib\/validations\/profile/@hanapkalinga\/shared\/validations/g'

# Update validation imports - booking
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/@\/lib\/validations\/booking/@hanapkalinga\/shared\/validations/g'

# Update validation imports - availability
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/@\/lib\/validations\/availability/@hanapkalinga/\/shared\/validations/g'

# Update ph-locations imports
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/@\/lib\/ph-locations/@hanapkalinga\/shared\/constants/g'
```

**On Windows (PowerShell):**

```powershell
# Update constants
Get-ChildItem -Recurse -Include *.ts,*.tsx | ForEach-Object { (Get-Content $_.FullName) -replace '@/lib/constants', '@hanapkalinga/shared/constants' | Set-Content $_.FullName }

# Update validations
Get-ChildItem -Recurse -Include *.ts,*.tsx | ForEach-Object { (Get-Content $_.FullName) -replace '@/lib/validations/(\w+)', '@hanapkalinga/shared/validations' | Set-Content $_.FullName }
```

## Manual Verification

After updating:

1. **Check TypeScript errors:**
   ```bash
   cd apps/web
   npm run lint
   ```

2. **Build the app:**
   ```bash
   npm run build
   ```

3. **Test locally:**
   ```bash
   npm run dev
   ```

4. **Verify key flows:**
   - Login/Signup
   - Profile creation (family and nurse)
   - Booking creation
   - Availability management

## Clean Up Old Files

After successfully updating imports, you can remove the duplicated files from `apps/web/lib`:

```bash
cd apps/web/lib
rm constants.ts ph-locations.ts
rm -rf validations/
```

**Keep these files in `apps/web/lib`:**
- `utils.ts` (Tailwind utility)
- `supabase/` (all Supabase clients)
- `auth-redirect.ts`
- `post-auth.ts`
- `storage-docs.ts`
- `user-errors.ts`
- `messages.ts`
- `booking-notes.ts`
- `availability-status.ts`

## Rollback

If something breaks:

1. Revert your changes: `git checkout apps/web`
2. Reinstall: `npm install`
3. Try the manual approach file-by-file
4. Report the issue

## Questions?

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for more details.
