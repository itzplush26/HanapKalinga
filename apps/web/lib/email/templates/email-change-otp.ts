import {
  appUrl,
  emailHeading,
  emailOtpCode,
  emailParagraph,
  escapeHtml,
  wrapEmailHtml
} from "@/lib/email/templates/layout";

export const EMAIL_CHANGE_OTP_SUBJECT = "Your HanapKalinga email change code";

export function buildEmailChangeOtpEmailHtml(params: { otp: string }): string {
  const profileUrl = appUrl("/dashboard/family/profile");

  return wrapEmailHtml(`
    ${emailHeading("Confirm your new email")}
    ${emailParagraph(
      "We received a request to change the email address on your HanapKalinga account. Enter this code on your profile page to confirm:"
    )}
    ${emailOtpCode(params.otp, "Your verification code")}
    ${emailParagraph(
      "If you did not request this change, you can ignore this email and your account email will stay the same. For your security, never share this code with anyone — HanapKalinga staff will never ask for it."
    )}
    ${emailParagraph(
      `You can enter the code in your profile settings at <a href="${escapeHtml(profileUrl)}" style="color:#0d9488;text-decoration:underline;">${escapeHtml(profileUrl)}</a>.`
    )}
  `);
}

export function buildEmailChangeOtpEmailText(params: { otp: string }): string {
  const profileUrl = appUrl("/dashboard/family/profile");

  return `Confirm your new email

We received a request to change the email address on your HanapKalinga account.

Your verification code: ${params.otp}

This code expires in 1 hour.

Enter it in your profile settings: ${profileUrl}

If you did not request this, ignore this email. Your account email will stay the same. Never share this code with anyone.

—
HanapKalinga
Connecting Filipino families with trusted healthcare professionals

This is an automated message. Please do not reply to this email.`;
}
