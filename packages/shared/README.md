# @hanapkalinga/shared

Shared code package for HanapKalinga web and mobile applications.

## Contents

This package contains business logic, types, and utilities that work across both web and mobile platforms:

### Constants (`/constants`)
- Application name and support email
- Provider specializations
- Booking skills
- Philippine regions and cities

### Types (`/types`)
- User roles and statuses
- Database table types
- Shared interfaces

### Validations (`/validations`)
- Zod schemas for forms
- Auth validation (login, signup, password reset)
- Profile validation (family and nurse profiles)
- Booking validation
- Availability validation

### Utils (`/utils`)
- Currency formatting
- Date/time formatting
- Shift label helpers
- Status color helpers
- Text utilities

### API (`/api`)
- Supabase configuration
- Shared API client setup

## Usage

### In Web App

```typescript
import { APP_NAME, PROVIDER_SPECIALIZATIONS } from '@hanapkalinga/shared/constants';
import { loginSchema } from '@hanapkalinga/shared/validations';
import { formatCurrency } from '@hanapkalinga/shared/utils';
import type { UserRole, Booking } from '@hanapkalinga/shared/types';
```

### In Mobile App (Future)

```typescript
import { APP_NAME } from '@hanapkalinga/shared/constants';
import { loginSchema } from '@hanapkalinga/shared/validations';
import type { Booking } from '@hanapkalinga/shared/types';
```

## Development

This package is part of the HanapKalinga monorepo workspace. Changes here automatically reflect in both web and mobile apps during development.

```bash
# Type check
npm run lint
```

## Notes

- This package contains **zero UI components** - UI is platform-specific
- All code here must work in both Node.js (Next.js SSR) and mobile environments
- No dependencies on React DOM or React Native
