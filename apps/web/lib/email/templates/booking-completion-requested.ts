import { emailButton, emailHeading, emailParagraph, escapeHtml, wrapEmailHtml, appUrl } from "./layout";

export interface BookingCompletionRequestedData {
  familyName: string;
  nurseName: string;
  requestedDate: string;
  shiftLabel: string;
  bookingId: string;
}

export function bookingCompletionRequestedEmail(data: BookingCompletionRequestedData) {
  const confirmUrl = appUrl(`/dashboard/family/bookings/${data.bookingId}?action=confirm`);
  const disputeUrl = appUrl(`/dashboard/family/bookings/${data.bookingId}?action=dispute`);

  const html = wrapEmailHtml(`
    ${emailHeading("Please confirm shift completion")}
    ${emailParagraph(`Hi ${escapeHtml(data.familyName)}, <strong>${escapeHtml(data.nurseName)}</strong> has marked the shift on <strong>${escapeHtml(data.requestedDate)}</strong> (${escapeHtml(data.shiftLabel)}) as complete.`)}
    ${emailParagraph("Please confirm within 24 hours, or the booking will be automatically completed.")}
    ${emailButton(confirmUrl, "Confirm shift complete")}
  <table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="padding-top:8px;">
    <a href="${escapeHtml(disputeUrl)}" style="font-size:14px;color:#dc2626;text-decoration:underline;">Dispute completion</a>
  </td></tr></table>
  `);

  return { subject: "Confirm your HanapKalinga shift completion", html };
}
