import { emailButton, emailHeading, emailParagraph, escapeHtml, wrapEmailHtml, appUrl } from "./layout";

export interface BookingDeclinedData {
  familyName: string;
  nurseName: string;
  reason?: string | null;
}

export function bookingDeclinedEmail(data: BookingDeclinedData) {
  const reasonBlock = data.reason
    ? emailParagraph(`<strong>Reason:</strong> ${escapeHtml(data.reason)}`)
    : "";

  const html = wrapEmailHtml(`
    ${emailHeading("Booking request declined")}
    ${emailParagraph(`Hi ${escapeHtml(data.familyName)}, unfortunately <strong>${escapeHtml(data.nurseName)}</strong> is unable to take this booking.`)}
    ${reasonBlock}
    ${emailParagraph("You can browse other verified nurses and caregivers in your area.")}
    ${emailButton(appUrl("/nurses"), "Find another nurse")}
  `);

  return { subject: "Your booking request was declined", html };
}
