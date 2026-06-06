# HanapKalinga Web App

Next.js web application for the HanapKalinga platform.

## Development

```bash
# From the root of the monorepo
npm install
npm run dev:web

# Or from this directory
npm install
npm run dev
```

## Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```

## Learn More

See the main [README](../../README.md) for full setup instructions.
