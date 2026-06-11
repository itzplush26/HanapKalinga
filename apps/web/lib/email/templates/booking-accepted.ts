import { emailButton, emailHeading, emailParagraph, escapeHtml, wrapEmailHtml, appUrl } from "./layout";

export interface BookingAcceptedData {
  familyName: string;
  nurseName: string;
  providerType: string;
  requestedDate: string;
  shiftLabel: string;
  bookingId: string;
}

export function bookingAcceptedEmail(data: BookingAcceptedData) {
  const url = appUrl(`/dashboard/family/bookings/${data.bookingId}`);
  const provider = data.providerType === "caregiver" ? "Caregiver" : "Nurse";

  const html = wrapEmailHtml(`
    ${emailHeading("Your booking was accepted!")}
    ${emailParagraph(`Hi ${escapeHtml(data.familyName)}, great news — <strong>${escapeHtml(data.nurseName)}</strong> (${provider}) has accepted your booking request.`)}
    ${emailParagraph(`<strong>Date:</strong> ${escapeHtml(data.requestedDate)}<br/><strong>Shift:</strong> ${escapeHtml(data.shiftLabel)}`)}
    ${emailButton(url, "View booking details")}
  `);

  return { subject: "Your HanapKalinga booking was accepted", html };
}
