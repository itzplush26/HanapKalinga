import { appUrl, emailButton, escapeHtml, wrapEmailHtml } from "@/lib/email/templates/layout";

export const VERIFICATION_DOCUMENT_REMINDER_SUBJECT =
  "Action needed: complete your HanapKalinga document upload";

export function buildVerificationDocumentReminderHtml(firstName: string): string {
  const profileUrl = appUrl("/dashboard/nurse/profile#documents");
  return wrapEmailHtml(`
    <p style="font-size:16px;color:#1a202c;">Hi ${escapeHtml(firstName)},</p>
    <p style="font-size:15px;color:#4a5568;line-height:1.7;">
      Your HanapKalinga account is almost ready. We still need your verification documents before an administrator can review your profile.
    </p>
    <p style="font-size:15px;color:#4a5568;line-height:1.7;">
      Please upload your PRC or TESDA certificate and NBI clearance from your profile page.
    </p>
    ${emailButton(profileUrl, "Upload documents")}
  `);
}

export function buildVerificationDocumentReminderText(firstName: string): string {
  const profileUrl = appUrl("/dashboard/nurse/profile#documents");
  return `Hi ${firstName},

Your HanapKalinga account is almost ready. We still need your verification documents before an administrator can review your profile.

Upload your documents here:
${profileUrl}`;
}
