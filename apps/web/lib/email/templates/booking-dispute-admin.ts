import {
  appUrl,
  emailButton,
  emailDetailBox,
  emailHeading,
  emailParagraph,
  escapeHtml,
  wrapEmailHtml
} from "@/lib/email/templates/layout";

export function buildBookingDisputeAdminEmailHtml(params: {
  bookingId: string;
  familyName: string;
  description: string;
}): string {
  const adminUrl = appUrl(`/admin/bookings/${params.bookingId}`);

  return wrapEmailHtml(`
    ${emailHeading("Booking dispute reported")}
    ${emailParagraph("A family member has reported a dispute on a booking.")}
    ${emailDetailBox(`
      <p style="margin:0 0 8px;font-size:14px;"><strong>Booking ID:</strong> ${escapeHtml(params.bookingId)}</p>
      <p style="margin:0 0 8px;font-size:14px;"><strong>Reported by:</strong> ${escapeHtml(params.familyName)}</p>
      <p style="margin:0;font-size:14px;"><strong>Description:</strong> ${escapeHtml(params.description)}</p>
    `)}
    ${emailButton(adminUrl, "Review booking")}
  `);
}

export function buildBookingDisputeAdminEmailText(params: {
  bookingId: string;
  familyName: string;
  description: string;
}): string {
  const adminUrl = appUrl(`/admin/bookings/${params.bookingId}`);

  return `Booking dispute reported

Booking ID: ${params.bookingId}
Reported by: ${params.familyName}
Description: ${params.description}

Review booking: ${adminUrl}`;
}
