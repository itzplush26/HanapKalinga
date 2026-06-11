import {
  appUrl,
  emailButton,
  emailCalloutStep,
  emailHeading,
  emailParagraph,
  escapeHtml,
  wrapEmailHtml
} from "@/lib/email/templates/layout";

export const VERIFICATION_APPROVED_SUBJECT =
  "Your HanapKalinga profile is now verified ✓";

export function buildVerificationApprovedEmailHtml(firstName: string): string {
  const name = escapeHtml(firstName.trim() || "there");
  const dashboardUrl = appUrl("/dashboard/nurse");

  return wrapEmailHtml(`
    ${emailHeading(`Congratulations, ${name}!`)}
    ${emailParagraph(
      "Your HanapKalinga profile has been <strong>verified and approved</strong>. Families across the Philippines can now discover your profile and send booking requests."
    )}
    ${emailParagraph("Here is what you can do next:")}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
      ${emailCalloutStep(1, "Set your availability so families know when you are free")}
      <tr><td style="height:8px;"></td></tr>
      ${emailCalloutStep(2, "Complete your profile with a photo and updated rates")}
      <tr><td style="height:8px;"></td></tr>
      ${emailCalloutStep(3, "Wait for your first booking request — we will notify you right away")}
    </table>
    ${emailButton(dashboardUrl, "Go to your dashboard")}
  `);
}

export function buildVerificationApprovedEmailText(firstName: string): string {
  const name = firstName.trim() || "there";
  const dashboardUrl = appUrl("/dashboard/nurse");

  return `Congratulations, ${name}!

Your HanapKalinga profile has been verified and approved. Families across the Philippines can now discover your profile and send booking requests.

What you can do next:
1. Set your availability so families know when you are free
2. Complete your profile with a photo and updated rates
3. Wait for your first booking request — we will notify you right away

Go to your dashboard: ${dashboardUrl}

—
HanapKalinga
Connecting Filipino families with trusted healthcare professionals

This is an automated message. Please do not reply to this email.`;
}
