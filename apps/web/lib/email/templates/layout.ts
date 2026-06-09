import { EMAIL_COLORS as C } from "@/lib/email/brand-colors";

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
  <tr><td style="border-radius:8px;background-color:${C.primary};">
    <a href="${safeHref}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:${C.textOnPrimary};text-decoration:none;">${safeLabel}</a>
  </td></tr></table>`;
}

export function emailDetailBox(innerHtml: string): string {
  return `<table role="presentation" width="100%" style="margin:16px 0;background:${C.surfaceAlt};border-radius:8px;padding:16px;">
  <tr><td style="font-size:14px;color:${C.textSecondary};line-height:1.8;">
    ${innerHtml}
  </td></tr></table>`;
}

export function emailDangerLink(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="padding-top:8px;">
    <a href="${safeHref}" style="font-size:14px;color:${C.error};text-decoration:underline;">${safeLabel}</a>
  </td></tr></table>`;
}

export function wrapEmailHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${C.bg};padding:24px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:${C.surface};border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background-color:${C.primary};padding:28px 24px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:${C.textOnPrimary};">HanapKalinga</p>
            <p style="margin:6px 0 0;font-size:13px;color:${C.primaryLight};">Trusted Healthcare Marketplace</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px;color:${C.textSecondary};font-size:15px;line-height:1.6;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px;background-color:${C.surfaceAlt};border-top:1px solid ${C.border};text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${C.secondary};">HanapKalinga</p>
            <p style="margin:0 0 8px;font-size:12px;color:${C.textMuted};">Connecting Filipino families with trusted healthcare professionals</p>
            <p style="margin:0;font-size:11px;color:${C.textMuted};">This is an automated message. You received this because you have an account on HanapKalinga.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function emailHeading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${C.secondary};line-height:1.3;">${escapeHtml(text)}</h1>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 14px;color:${C.textSecondary};">${text}</p>`;
}

export function emailCalloutStep(stepNumber: number, text: string): string {
  return `<tr>
    <td style="padding:12px 16px;background-color:${C.surfaceAlt};border-radius:8px;">
      <p style="margin:0;font-size:15px;color:${C.secondary};"><strong>${stepNumber}.</strong> ${escapeHtml(text)}</p>
    </td>
  </tr>`;
}

export function appUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://hanapkalinga.com";
  return `${base.replace(/\/$/, "")}${path}`;
}
