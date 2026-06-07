# Verification Email Setup (Supabase + Gmail SMTP)

HanapKalinga uses **two separate email paths**:

1. **Supabase Auth emails** — signup OTP, password reset  
2. **App verification emails** — approve / reject / resubmission notifications

Both can use the same Gmail account, but they are configured in different places.

---

## Part A — Supabase Auth (OTP & password reset)

Use this for login/signup emails sent by Supabase Auth.

1. Create a **Google App Password**  
   - Google Account → Security → 2-Step Verification → App passwords  
   - Generate a password for “Mail”

2. In **Supabase Dashboard** → **Project Settings** → **Authentication** → **SMTP Settings**:
   - Enable custom SMTP
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: your Gmail address
   - Password: the 16-character app password
   - Sender email: same Gmail address
   - Sender name: `HanapKalinga`

3. Save and send a test email from the Supabase dashboard.

> These settings do **not** automatically send verification outcome emails. They only affect Supabase Auth flows.

---

## Part B — Verification notification emails (this app)

When an admin approves, rejects, or requests resubmission, the app:

1. Writes an in-app notification to `public.notifications`
2. Sends email via the Next.js API route using **Nodemailer + Gmail SMTP**

### Required environment variables

Add these to `apps/web/.env.local` (local) and **Vercel → Environment Variables** (production):

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=HanapKalinga <your@gmail.com>

NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

| Variable | Purpose |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side writes to notifications & audit logs |
| `SMTP_*` | Sends verification outcome emails |
| `NEXT_PUBLIC_APP_URL` | Link in email body to nurse dashboard |

### Gmail limits

- Gmail SMTP is fine for development and low-volume production.
- For higher volume, consider SendGrid, Resend, or Amazon SES later.

### If email fails

- In-app notifications still work.
- The admin UI shows a toast if email delivery failed.
- Check Vercel/server logs for SMTP errors.

---

## Part C — Database migration

Run migration `0010_verification_notifications.sql` in Supabase SQL Editor. It adds:

- Extended verification statuses (`under_review`, `resubmission_required`)
- `notifications` table
- `verification_audit_logs` table
- Trigger preventing nurses from self-verifying

---

## Testing checklist

1. Apply migration `0010`
2. Configure SMTP env vars and redeploy
3. Log in as admin → **Verifications** → open an applicant
4. Approve or reject with a reason
5. Confirm:
   - Applicant sees notification on nurse dashboard
   - Applicant receives email (check spam folder)
   - Audit log entry appears on the review page

---

## Example notification copy

**Approved**

> Congratulations! Your account has been successfully verified. You now have full access to all platform features.

**Rejected**

> Unfortunately, your verification request was not approved. Please review the reason provided and submit updated documents for review.

**Resubmission required**

> We need additional information before we can approve your account. Please update your documents and resubmit for review.
