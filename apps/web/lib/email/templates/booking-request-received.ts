import {
  appUrl,
  emailButton,
  emailDetailBox,
  emailHeading,
  emailParagraph,
  escapeHtml,
  wrapEmailHtml
} from "./layout";

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
    ${emailDetailBox(`
        <strong>Contact:</strong> ${escapeHtml(data.familyContactName)}<br/>
        <strong>Patient:</strong> ${escapeHtml(data.patientName)}<br/>
        <strong>Date:</strong> ${escapeHtml(data.requestedDate)}<br/>
        <strong>Shift:</strong> ${escapeHtml(data.shiftLabel)}<br/>
        <strong>Condition:</strong> ${escapeHtml(data.patientCondition)}<br/>
        <strong>Skills needed:</strong> ${skills}<br/>
        <strong>Budget:</strong> ${escapeHtml(data.budgetLabel)}
    `)}
    ${emailButton(url, "View booking request")}
  `);

  return {
    subject: "New booking request on HanapKalinga",
    html
  };
}
