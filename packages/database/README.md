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
| 0008_nurse_docs_storage_policies.sql | Storage RLS for nurse document uploads |
| 0009_nurse_rate_ranges.sql | Optional rate range metadata on nurses |
| 0010_verification_notifications.sql | Notifications, audit logs, extended verification statuses |

## Admin login troubleshooting

If password login fails for `admin@hanapkalinga.ph` after seeding:

1. Re-run `supabase/seed.sql` — it is idempotent and creates the missing `auth.identities` row when needed.
2. Confirm migrations through **0007** are applied (admin RLS helper).
3. Verify the web app env vars point to the same Supabase project where seed was run.
