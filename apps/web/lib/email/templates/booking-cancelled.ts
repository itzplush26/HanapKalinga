import { emailButton, emailHeading, emailParagraph, escapeHtml, wrapEmailHtml, appUrl } from "./layout";

export interface BookingCancelledData {
  recipientName: string;
  cancelledByLabel: string;
  requestedDate: string;
  reason: string;
  isNurseRecipient: boolean;
}

export function bookingCancelledEmail(data: BookingCancelledData) {
  const cta = data.isNurseRecipient
    ? ""
    : emailButton(appUrl("/nurses"), "Find another nurse");

  const html = wrapEmailHtml(`
    ${emailHeading("Booking cancelled")}
    ${emailParagraph(`Hi ${escapeHtml(data.recipientName)}, a booking scheduled for <strong>${escapeHtml(data.requestedDate)}</strong> was cancelled by ${escapeHtml(data.cancelledByLabel)}.`)}
    ${emailParagraph(`<strong>Reason:</strong> ${escapeHtml(data.reason)}`)}
    ${cta}
  `);

  return { subject: "HanapKalinga booking cancelled", html };
}
