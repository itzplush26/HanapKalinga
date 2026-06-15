import {
  appUrl,
  emailHeading,
  emailOtpCode,
  emailParagraph,
  escapeHtml,
  wrapEmailHtml
} from "@/lib/email/templates/layout";

export const PASSWORD_RESET_OTP_SUBJECT = "Your HanapKalinga password reset code";

export function buildPasswordResetOtpEmailHtml(params: { otp: string }): string {
  const loginUrl = appUrl("/login");

  return wrapEmailHtml(`
    ${emailHeading("Reset your password")}
    ${emailParagraph(
      "We received a request to reset the password for your HanapKalinga account. Enter this code on the reset password page:"
    )}
    ${emailOtpCode(params.otp)}
    ${emailParagraph(
      `If you did not request this, you can ignore this email. Your password will stay the same. For your security, never share this code with anyone — HanapKalinga staff will never ask for it.`
    )}
    ${emailParagraph(`After resetting, sign in at <a href="${escapeHtml(loginUrl)}" style="color:#0d9488;text-decoration:underline;">${escapeHtml(loginUrl)}</a>.`)}
  `);
}

export function buildPasswordResetOtpEmailText(params: { otp: string }): string {
  const loginUrl = appUrl("/login");

  return `Reset your password

We received a request to reset the password for your HanapKalinga account.

Your reset code: ${params.otp}

This code expires in 1 hour.

Enter it at: ${appUrl("/login/update-password")}

If you did not request this, ignore this email. Your password will stay the same. Never share this code with anyone.

Sign in after resetting: ${loginUrl}

—
HanapKalinga
Connecting Filipino families with trusted healthcare professionals

This is an automated message. Please do not reply to this email.`;
}
