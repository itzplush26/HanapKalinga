import { emailButton, emailHeading, emailParagraph, escapeHtml, wrapEmailHtml, appUrl } from "./layout";

export interface LicenseExpiryWarningData {
  nurseName: string;
  documentLabel: string;
  expiryDate: string;
  isExpired: boolean;
}

export function licenseExpiryWarningEmail(data: LicenseExpiryWarningData) {
  const html = wrapEmailHtml(`
    ${emailHeading(data.isExpired ? "Document expired" : "Document expiring soon")}
    ${emailParagraph(`Hi ${escapeHtml(data.nurseName)}, your <strong>${escapeHtml(data.documentLabel)}</strong> ${data.isExpired ? "has expired" : "expires"} on <strong>${escapeHtml(data.expiryDate)}</strong>.`)}
    ${emailParagraph(
      data.isExpired
        ? "Your HanapKalinga account is restricted until you upload a renewed document and an admin updates your expiry date."
        : "Please upload a renewed document through your profile before it expires to avoid interruption."
    )}
    ${emailButton(appUrl("/dashboard/nurse/profile"), "Update documents")}
  `);

  return {
    subject: data.isExpired
      ? "Action required: document expired on HanapKalinga"
      : "Reminder: document expiring soon on HanapKalinga",
    html
  };
}
