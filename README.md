# HanapKalinga

Mobile-first marketplace for connecting Filipino families with verified private duty nurses and caregivers.

## Local setup

1. Install dependencies.
2. Create a Supabase project and apply migrations in `supabase/migrations` (including `0007_fix_rls_admin_recursion.sql`).
3. Seed the admin account using `supabase/seed.sql`.
4. Configure environment variables.
5. Run the dev server.

## Environment variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Supabase setup steps

1. Create a new Supabase project.
2. Enable Email auth in Supabase: confirm email via OTP for signup, and enable password sign-in.
3. Add your site URL and redirect URLs in Supabase Auth settings:
   - Site URL: your production URL (e.g. `https://your-app.vercel.app`)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://your-app.vercel.app/auth/callback`
4. Create a private storage bucket named `nurse-docs`.
5. Run the SQL files in `supabase/migrations` in order.
6. Run `supabase/seed.sql` to insert the admin user and profile.

SMTP note: Supabase can send auth emails via its own SMTP on free tier, but this project may use a custom SMTP sender.

Seeded admin credentials (after seed):

- Email: `admin@hanapkalinga.ph`
- Password: `ChangeMe123!`

If you previously seeded `admin@nurselink.ph`, either re-run seed on a fresh project or update the auth user email and ensure a matching `profiles` row with `role = 'admin'`.

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - build for production
- `npm run start` - run production server
- `npm run lint` - run linting
