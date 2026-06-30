import { emailButton, emailHeading, emailParagraph, escapeHtml, wrapEmailHtml, appUrl } from "./layout";

export interface CareRequestPostedData {
  nurseName: string;
  title: string;
  city: string;
  careType: string;
  budgetLabel: string;
  careRequestId: string;
}

export function careRequestPostedEmail(data: CareRequestPostedData) {
  const html = wrapEmailHtml(`
    ${emailHeading("New care request in your area")}
    ${emailParagraph(`Hi ${escapeHtml(data.nurseName)}, a family in <strong>${escapeHtml(data.city)}</strong> posted a care request that matches your profile.`)}
    ${emailParagraph(`<strong>${escapeHtml(data.title)}</strong><br/>
    Care type: ${escapeHtml(data.careType)}<br/>
    Budget: ${escapeHtml(data.budgetLabel)}`)}
    ${emailButton(appUrl(`/dashboard/nurse/bookings?tab=find-work`), "View care requests")}
  `);

  return { subject: "New care request on HanapKalinga", html };
}
