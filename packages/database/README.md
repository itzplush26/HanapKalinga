# HanapKalinga Database

Supabase database migrations and seed data shared between web and mobile apps.

## Contents

- `supabase/migrations/` - SQL migration files
- `supabase/seed.sql` - Seed data for development

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable Email auth with OTP confirmation
3. Add your URLs to Supabase Auth settings:
   - Site URL: Your production URL
   - Redirect URLs: `http://localhost:3000/auth/callback`, your production callback URL
4. Create a storage bucket named `nurse-docs` (private)
5. Run migrations in order from `supabase/migrations/`
6. Run `supabase/seed.sql` for the admin account

## Admin Credentials

After running the seed file:

- Email: `admin@hanapkalinga.ph`
- Password: `ChangeMe123!`

**Important:** Change this password in production!

## Migrations

| File | Description |
|------|-------------|
| 0001_init.sql | Initial schema with profiles, nurses, families, bookings, messages, reviews, availability |
| 0002_profile_fields.sql | Additional profile fields |
| 0003_onboarding_fields.sql | Onboarding status tracking |
| 0004_role_lock.sql | Prevent role changes after creation |
| 0005_registration_rules.sql | Registration flow constraints |
| 0006_nurse_ratings_and_message_read.sql | Ratings and message read status |
| 0007_fix_rls_admin_recursion.sql | Fix RLS policies for admin access |
