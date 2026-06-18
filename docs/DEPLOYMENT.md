# Deploying HanapKalinga to Vercel

This repo is an npm workspaces monorepo. The Next.js app lives in `apps/web/`.

## Recommended Vercel project settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` (default) |
| **Install Command** | `cd ../.. && npm ci` |
| **Output Directory** | leave empty (default `.next`) |

When Root Directory is `apps/web`, the build writes to `apps/web/.next` and Vercel finds `routes-manifest.json` correctly.

## Alternative: deploy from monorepo root

If Root Directory is left blank (repository root), the root `vercel.json` runs `npm run vercel-build`, which:

1. Builds `@hanapkalinga/web`
2. Copies `apps/web/.next` → `.next` at the repo root

**Important:** In Vercel Dashboard → Settings → General, clear any custom **Output Directory** override (do not set it to `.next` manually when using the wrong root).

## Required environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

Optional: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`
