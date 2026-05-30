# NurseLink PH

Mobile-first marketplace MVP for connecting Filipino families with verified private duty nurses.

## Local setup

1. Install dependencies.
2. Create a Supabase project and apply migrations in `supabase/migrations`.
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
2. Enable email OTP auth in Supabase (no SMS in MVP).
3. Create a private storage bucket named `nurse-docs`.
4. Run the SQL files in `supabase/migrations` in order.
5. Run `supabase/seed.sql` to insert the admin user and profile.

SMTP note: Supabase can send auth emails via its own SMTP on free tier, but this project is configured to use your Gmail SMTP sender.

Seeded admin credentials:

- Email: admin@nurselink.ph
- Password: ChangeMe123!

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - build for production
- `npm run start` - run production server
- `npm run lint` - run linting
