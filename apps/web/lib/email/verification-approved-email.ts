const TEAL = "#0D7C6E";
const NAVY = "#0B1F3A";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hanapkalinga.com";

export const VERIFICATION_APPROVED_SUBJECT =
  "Your HanapKalinga profile is now verified ✓";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildVerificationApprovedEmailHtml(firstName: string): string {
  const name = escapeHtml(firstName.trim() || "there");
  const dashboardUrl = `${APP_URL}/dashboard/nurse`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${VERIFICATION_APPROVED_SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:${TEAL};padding:32px 24px;text-align:center;">
              <p style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">HanapKalinga</p>
              <p style="margin:8px 0 0;font-size:14px;color:#e6f7f4;">Trusted Healthcare Marketplace</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:${NAVY};line-height:1.3;">
                Congratulations, ${name}!
              </h1>
              <p style="margin:0 0 20px;font-size:16px;color:#334155;line-height:1.6;">
                Your HanapKalinga profile has been <strong>verified and approved</strong>. Families across the Philippines can now discover your profile and send booking requests.
              </p>
              <p style="margin:0 0 24px;font-size:16px;color:#334155;line-height:1.6;">
                Here is what you can do next:
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:12px 16px;background-color:#f8fafc;border-radius:8px;margin-bottom:8px;">
                    <p style="margin:0;font-size:15px;color:${NAVY};"><strong>1.</strong> Set your availability so families know when you are free</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f8fafc;border-radius:8px;">
                    <p style="margin:0;font-size:15px;color:${NAVY};"><strong>2.</strong> Complete your profile with a photo and updated rates</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f8fafc;border-radius:8px;">
                    <p style="margin:0;font-size:15px;color:${NAVY};"><strong>3.</strong> Wait for your first booking request — we will notify you right away</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 8px;">
                <tr>
                  <td style="border-radius:8px;background-color:${TEAL};">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">
                      Go to your dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:${NAVY};">HanapKalinga</p>
              <p style="margin:0 0 12px;font-size:13px;color:#64748b;">Connecting Filipino families with trusted healthcare professionals</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">This is an automated message. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildVerificationApprovedEmailText(firstName: string): string {
  const name = firstName.trim() || "there";
  const dashboardUrl = `${APP_URL}/dashboard/nurse`;

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
