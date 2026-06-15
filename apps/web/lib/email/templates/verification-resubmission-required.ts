import {
  appUrl,
  emailButton,
  emailDetailBox,
  emailHeading,
  emailParagraph,
  escapeHtml,
  wrapEmailHtml
} from "@/lib/email/templates/layout";

export const VERIFICATION_RESUBMISSION_SUBJECT =
  "Action needed: additional documents for HanapKalinga";

export function buildVerificationResubmissionEmailHtml(params: {
  firstName: string;
  reason: string;
  details?: string | null;
}): string {
  const name = escapeHtml(params.firstName.trim() || "there");
  const profileUrl = appUrl("/dashboard/nurse/profile#documents");
  const reasonHtml = escapeHtml(params.reason);
  const details = params.details?.trim()
    ? `<p style="margin:12px 0 0;font-size:14px;color:#4a5568;">${escapeHtml(params.details)}</p>`
    : "";

  return wrapEmailHtml(`
    ${emailHeading(`Hi ${name},`)}
    ${emailParagraph(
      "We need additional information before we can approve your HanapKalinga account."
    )}
    ${emailDetailBox(`
      <p style="margin:0;font-size:14px;font-weight:600;color:#1a202c;">What we need</p>
      <p style="margin:8px 0 0;font-size:14px;color:#4a5568;">${reasonHtml}</p>
      ${details}
    `)}
    ${emailParagraph(
      "Please sign in, update your documents, and resubmit for review."
    )}
    ${emailButton(profileUrl, "Update my documents")}
  `);
}

export function buildVerificationResubmissionEmailText(params: {
  firstName: string;
  reason: string;
  details?: string | null;
}): string {
  const name = params.firstName.trim() || "there";
  const profileUrl = appUrl("/dashboard/nurse/profile#documents");
  const details = params.details?.trim() ? `\n\nDetails: ${params.details}` : "";

  return `Hi ${name},

We need additional information before we can approve your HanapKalinga account.

What we need:
${params.reason}${details}

Please sign in and update your documents:
${profileUrl}

—
HanapKalinga
Connecting Filipino families with trusted healthcare professionals

This is an automated message. Please do not reply to this email.`;
}
