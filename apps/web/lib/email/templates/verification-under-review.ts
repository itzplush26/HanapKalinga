import {
  appUrl,
  emailButton,
  emailCalloutStep,
  emailHeading,
  emailParagraph,
  escapeHtml,
  wrapEmailHtml
} from "@/lib/email/templates/layout";

export const VERIFICATION_UNDER_REVIEW_SUBJECT =
  "Your HanapKalinga verification is under review";

export function buildVerificationUnderReviewEmailHtml(firstName: string): string {
  const name = escapeHtml(firstName.trim() || "there");
  const dashboardUrl = appUrl("/dashboard/nurse");

  return wrapEmailHtml(`
    ${emailHeading(`Hi ${name},`)}
    ${emailParagraph(
      "An administrator is now reviewing your verification documents. We will notify you by email once a decision has been made."
    )}
    ${emailParagraph("While you wait:")}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
      ${emailCalloutStep(1, "Keep your profile and documents up to date")}
      <tr><td style="height:8px;"></td></tr>
      ${emailCalloutStep(2, "Reviews usually take 1 to 3 business days")}
      <tr><td style="height:8px;"></td></tr>
      ${emailCalloutStep(3, "We will email you as soon as your verification is approved or needs changes")}
    </table>
    ${emailButton(dashboardUrl, "View your dashboard")}
  `);
}

export function buildVerificationUnderReviewEmailText(firstName: string): string {
  const name = firstName.trim() || "there";
  const dashboardUrl = appUrl("/dashboard/nurse");

  return `Hi ${name},

An administrator is now reviewing your verification documents. We will notify you by email once a decision has been made.

While you wait:
1. Keep your profile and documents up to date
2. Reviews usually take 1 to 3 business days
3. We will email you as soon as your verification is approved or needs changes

View your dashboard: ${dashboardUrl}

—
HanapKalinga
Connecting Filipino families with trusted healthcare professionals

This is an automated message. Please do not reply to this email.`;
}
