# Email Setup — HanapKalinga (NurseLink)

HanapKalinga uses **two separate email paths**. This document explains both and how to configure them for a professional, branded email experience.

---

## Overview

| Path | Purpose | Email Provider | From Address |
|---|---|---|---|
| **Supabase Auth Emails** | OTP codes (signup), password reset emails | Supabase Auth → SMTP (Resend) | `HanapKalinga <noreply@hanapkalinga.com>` |
| **Admin Notification Emails** | Verification approve/reject/resubmission notices | Resend API (via web app) | `HanapKalinga <noreply@hanapkalinga.com>` |

Both paths use **Resend** as the email provider, ensuring consistent branding and deliverability.

---

## Part A — Supabase Auth Emails (OTP & Password Reset)

These are the emails sent automatically by Supabase Auth when a user:
- Signs up via the mobile app (`supabase.auth.signInWithOtp()`)
- Requests a password reset (`supabase.auth.resetPasswordForEmail()`)

### How It Works

The mobile app calls Supabase Auth directly — it does NOT go through your web app or use the `RESEND_API_KEY`. Instead, Supabase Auth sends the email using the **SMTP provider** configured in the Supabase Dashboard.

### Configuration (Supabase Dashboard)

1. Go to **Supabase Dashboard → Project Settings → Authentication → SMTP Settings**
2. Enable **Custom SMTP**
3. Fill in the following:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `587` |
| Username | `resend` |
| Password | Your Resend API key (e.g., `re_...`) |
| Sender email | `noreply@hanapkalinga.com` |
| Sender name | `HanapKalinga` |

4. Click **Save** and send a test email from the dashboard.

> **Important:** The sender email domain (`hanapkalinga.com`) must be verified in your Resend account. See [Part C](#part-c-domain-verification-in-resend).

### What Users Will See

```
From: HanapKalinga <noreply@hanapkalinga.com>
Subject: Your OTP code is XXXXXX
```

Branded, professional, no personal Gmail addresses visible.

### Relevant Mobile Code

| File | Purpose |
|---|---|
| `apps/mobile/app/(auth)/register/index.tsx` | Calls `supabase.auth.signInWithOtp()` |
| `apps/mobile/app/(auth)/register/verify-otp.tsx` | Calls `supabase.auth.verifyOtp()` + resend logic |
| `apps/mobile/app/(auth)/forgot-password.tsx` | Calls `supabase.auth.resetPasswordForEmail()` |

---

## Part B — Admin Verification Notification Emails

These are sent when an admin approves, rejects, or requests resubmission from a nurse's verification.

### How It Works

1. Admin performs action via web dashboard
2. `POST /api/admin/verification` processes the action
3. `sendEmailSafe()` is called — which uses the **Resend SDK** directly
4. An in-app notification is also inserted into `public.notifications`
5. An audit log entry is inserted into `verification_audit_logs`

### Call Chain

```
Admin clicks "Approve" / "Reject" / etc.
  → POST /api/admin/verification   (apps/web/app/api/admin/verification/route.ts)
    → sendEmailSafe()               (apps/web/lib/email/send-safe.ts)
      → sendEmail()                 (apps/web/lib/email/send.ts)
        → resend.emails.send()      (uses RESEND_API_KEY from env)
```

### Required Environment Variables

Add these to `apps/web/.env.local` (and Vercel → Environment Variables for production):

```env
RESEND_API_KEY=re_...                             # Required
RESEND_FROM_EMAIL=no-reply@hanapkalinga.com        # Optional (default: no-reply@hanapkalinga.com)

NEXT_PUBLIC_APP_URL=https://your-domain.com        # Used in email body links
```

### What Users Will See

```
From: HanapKalinga <noreply@hanapkalinga.com>
Subject: [HanapKalinga] Your Verification Has Been Approved ✅
```

### Email Templates

All templates live at `apps/web/lib/email/templates/`:

| File | Trigger |
|---|---|
| `verification-approved.ts` | Admin approves nurse |
| `verification-rejected.ts` | Admin rejects nurse |
| `verification-resubmission-required.ts` | Admin requests resubmission |
| `verification-under-review.ts` | Admin marks as under review |
| `verification-document-reminder.ts` | Admin sends document reminder |
| `password-reset-otp.ts` | (Legacy) Password reset — Supabase handles this now |
| `booking-*.ts` | Booking lifecycle emails |
| `care-request-*.ts` | Care request emails |
| `incident-report-received.ts` | Incident report submitted |
| `license-expiry-warning.ts` | License about to expire |
| `review-submitted.ts` | Review received |

### Related Code

| File | Role |
|---|---|
| `apps/web/lib/email/send.ts` | Resend client, `sendEmail()` function |
| `apps/web/lib/email/send-safe.ts` | Fire-and-forget wrapper |
| `apps/web/lib/email/templates/*.ts` | HTML email builders |

---

## Part C — Domain Verification in Resend

Before you can send emails as `noreply@hanapkalinga.com`, you must verify the domain `hanapkalinga.com` in Resend.

### Steps

1. Log in to [Resend Dashboard](https://resend.com)
2. Go to **Domains** → **Add Domain**
3. Enter `hanapkalinga.com`
4. Resend will give you a **TXT record** to add to your DNS
5. Add the TXT record in your DNS provider (e.g., Cloudflare, GoDaddy, Namecheap)
6. Click **Verify** in Resend
7. Wait a few minutes for DNS propagation

Once verified, you can send from any address at `@hanapkalinga.com`.

> If `hanapkalinga.com` is not yet verified, you can verify a different domain you control (e.g., `your-startup.com`) and use `noreply@your-startup.com` as the sender instead. The display name "HanapKalinga" will still show.

---

## Part D — Resend Limits & Pricing

| Tier | Daily Limit | Monthly Price |
|---|---|---|
| **Free** | 100 emails/day | $0 |
| **Pro** | 50,000 emails/day | $20/mo |
| **Scale** | 500,000 emails/day | $100/mo |

For a healthcare app in the Philippines, the **Free** tier (100/day) is sufficient during development and early launch. Upgrade to **Pro** once user base grows.

---

## Part E — Testing Checklist

After configuration, verify everything works:

- [ ] Domain verified in Resend
- [ ] Supabase Auth SMTP updated to Resend (not Gmail)
- [ ] `RESEND_API_KEY` set in `apps/web/.env.local`
- [ ] Test OTP signup from mobile app — check From address
- [ ] Test password reset from mobile app
- [ ] Log in as admin → approve a nurse → check email arrives
- [ ] Log in as admin → reject a nurse → check email arrives
- [ ] Check spam folder for any of the above
- [ ] Confirm `public.notifications` and `verification_audit_logs` are written

---

## Part F — Troubleshooting

### Email not arriving at all

- Check Supabase Dashboard → Auth → SMTP Settings → Send test email
- Check Resend Dashboard → Logs for delivery failures
- Verify the recipient email is not a typo

### "From" shows a personal Gmail address

You likely still have Gmail SMTP configured in Supabase Dashboard. Switch to Resend SMTP (see Part A).

### Spam flagged

- Ensure SPF, DKIM, and DMARC records are set up for your domain in Resend
- Avoid spammy subject lines like "FREE" or "ACT NOW"
- Keep plain-text versions alongside HTML

### Resend API errors in admin verification

- Check that `RESEND_API_KEY` is set in the environment
- Check Resend Dashboard → API Keys to ensure the key is active
- Verify the `RESEND_FROM_EMAIL` domain is verified

---

## Migration Notes (Gmail SMTP → Resend)

If you were previously using Gmail SMTP, the migration is simple:

1. Verify domain in Resend (Part C)
2. Update Supabase Auth SMTP settings (Part A) — change Host, Username, Password
3. Your `RESEND_API_KEY` is already configured in `.env.local`
4. Remove Gmail App Passwords — no longer needed
5. Delete or archive `apps/web/lib/email/send-mail.ts` (legacy Nodemailer fallback)

No code changes needed in the mobile app — it talks to Supabase Auth, which now uses the new SMTP.

---

## Summary

```
                    ┌─────────────────────────────────────┐
                    │          Resend (resend.com)          │
                    │  Verified domain: hanapkalinga.com   │
                    └──────┬──────────────────┬────────────┘
                           │                  │
              ┌────────────┘                  └────────────┐
              ▼                                             ▼
┌─────────────────────────┐                 ┌─────────────────────────────┐
│  Supabase Auth SMTP     │                 │  Web App (Next.js)          │
│  (smtp.resend.com:587)  │                 │  /api/admin/verification    │
│                         │                 │  RESEND_API_KEY env var     │
│  Sends: OTP,            │                 │                             │
│  password reset emails  │                 │  Sends: approve/reject/     │
│                         │                 │  resubmission emails        │
└─────────────────────────┘                 └─────────────────────────────┘
         │                                               │
         └─────────────── Both send from ────────────────┘
                                 │
                                 ▼
                  HanapKalinga <noreply@hanapkalinga.com>
```

