import { emailButton, emailHeading, emailParagraph, escapeHtml, wrapEmailHtml, appUrl } from "./layout";

export interface BookingCompletedData {
  recipientName: string;
  nurseName: string;
  requestedDate: string;
  shiftLabel: string;
  bookingId: string;
  isFamily: boolean;
}

export function bookingCompletedEmail(data: BookingCompletedData) {
  const reviewBlock = data.isFamily
    ? emailButton(appUrl(`/dashboard/family/bookings/${data.bookingId}`), "Leave a review")
    : "";

  const html = wrapEmailHtml(`
    ${emailHeading("Booking completed")}
    ${emailParagraph(`Hi ${escapeHtml(data.recipientName)}, the booking with <strong>${escapeHtml(data.nurseName)}</strong> on <strong>${escapeHtml(data.requestedDate)}</strong> (${escapeHtml(data.shiftLabel)}) is now complete.`)}
    ${data.isFamily ? emailParagraph("We would love to hear about your experience.") : emailParagraph("Thank you for providing care through HanapKalinga.")}
    ${reviewBlock}
  `);

  return { subject: "Your HanapKalinga booking is complete", html };
}
