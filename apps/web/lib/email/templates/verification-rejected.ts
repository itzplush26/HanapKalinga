import { appUrl, emailButton, escapeHtml, wrapEmailHtml } from "@/lib/email/templates/layout";

export const VERIFICATION_REJECTED_SUBJECT =
  "Action required — your HanapKalinga verification needs attention.";

export function buildVerificationRejectedEmailHtml(params: {
  firstName: string;
  reason: string;
  details?: string | null;
}): string {
  const profileUrl = appUrl("/dashboard/nurse/profile#documents");
  const details = params.details?.trim()
    ? `<p style="margin:12px 0 0;font-size:14px;color:#4a5568;">${escapeHtml(params.details)}</p>`
    : "";

  return wrapEmailHtml(`
    <p style="font-size:16px;color:#1a202c;">Hi ${escapeHtml(params.firstName)},</p>
    <p style="font-size:15px;color:#4a5568;line-height:1.7;">
      Unfortunately, we could not approve your verification at this time.
    </p>
    <p style="font-size:15px;color:#1a202c;font-weight:600;margin-top:16px;">Reason</p>
    <p style="font-size:14px;color:#4a5568;">${escapeHtml(params.reason)}</p>
    ${details}
    <p style="font-size:15px;color:#4a5568;line-height:1.7;margin-top:16px;">
      Please sign in, open your profile, and upload corrected documents. We will review your application again after you resubmit.
    </p>
    ${emailButton(profileUrl, "Update my documents")}
  `);
}

export function buildVerificationRejectedEmailText(params: {
  firstName: string;
  reason: string;
  details?: string | null;
}): string {
  const profileUrl = appUrl("/dashboard/nurse/profile#documents");
  const details = params.details?.trim() ? `\n\nDetails: ${params.details}` : "";
  return `Hi ${params.firstName},

Unfortunately, we could not approve your verification at this time.

Reason: ${params.reason}${details}

Please sign in and upload corrected documents from your profile:
${profileUrl}`;
}
