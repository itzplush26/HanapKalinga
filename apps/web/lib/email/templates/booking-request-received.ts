import { emailButton, emailHeading, emailParagraph, escapeHtml, wrapEmailHtml, appUrl } from "./layout";

export interface BookingRequestReceivedData {
  nurseName: string;
  familyContactName: string;
  patientName: string;
  requestedDate: string;
  shiftLabel: string;
  patientCondition: string;
  skills: string[];
  budgetLabel: string;
  bookingId: string;
}

export function bookingRequestReceivedEmail(data: BookingRequestReceivedData) {
  const skills = data.skills.length ? data.skills.map(escapeHtml).join(", ") : "Not specified";
  const url = appUrl(`/dashboard/nurse/bookings/${data.bookingId}`);

  const html = wrapEmailHtml(`
    ${emailHeading(`New booking request, ${escapeHtml(data.nurseName)}`)}
    ${emailParagraph("A family has sent you a new booking request on HanapKalinga.")}
    <table role="presentation" width="100%" style="margin:16px 0;background:#f8fafc;border-radius:8px;padding:16px;">
      <tr><td style="font-size:14px;color:#334155;line-height:1.8;">
        <strong>Contact:</strong> ${escapeHtml(data.familyContactName)}<br/>
        <strong>Patient:</strong> ${escapeHtml(data.patientName)}<br/>
        <strong>Date:</strong> ${escapeHtml(data.requestedDate)}<br/>
        <strong>Shift:</strong> ${escapeHtml(data.shiftLabel)}<br/>
        <strong>Condition:</strong> ${escapeHtml(data.patientCondition)}<br/>
        <strong>Skills needed:</strong> ${skills}<br/>
        <strong>Budget:</strong> ${escapeHtml(data.budgetLabel)}
      </td></tr>
    </table>
    ${emailButton(url, "View booking request")}
  `);

  return {
    subject: "New booking request on HanapKalinga",
    html
  };
}
