const TEAL = "#0D7C6E";
const NAVY = "#0B1F3A";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:16px 0;">
  <tr><td style="border-radius:8px;background-color:${TEAL};">
    <a href="${safeHref}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${safeLabel}</a>
  </td></tr></table>`;
}

export function wrapEmailHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:24px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background-color:${TEAL};padding:28px 24px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">HanapKalinga</p>
            <p style="margin:6px 0 0;font-size:13px;color:#e6f7f4;">Trusted Healthcare Marketplace</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px;color:#334155;font-size:15px;line-height:1.6;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${NAVY};">HanapKalinga</p>
            <p style="margin:0 0 8px;font-size:12px;color:#64748b;">Connecting Filipino families with trusted healthcare professionals</p>
            <p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated message. You received this because you have an account on HanapKalinga.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function emailHeading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${NAVY};line-height:1.3;">${escapeHtml(text)}</h1>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 14px;color:#334155;">${text}</p>`;
}

export function appUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://hanapkalinga.com";
  return `${base.replace(/\/$/, "")}${path}`;
}
