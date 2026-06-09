import { emailButton, emailHeading, emailParagraph, escapeHtml, wrapEmailHtml, appUrl } from "./layout";

export interface IncidentReportReceivedData {
  reporterName: string;
  reportedUserName: string;
  category: string;
  description: string;
  reportId: string;
}

export function incidentReportReceivedEmail(data: IncidentReportReceivedData) {
  const html = wrapEmailHtml(`
    ${emailHeading("New incident report")}
    ${emailParagraph(`<strong>Reporter:</strong> ${escapeHtml(data.reporterName)}<br/>
    <strong>Reported user:</strong> ${escapeHtml(data.reportedUserName)}<br/>
    <strong>Category:</strong> ${escapeHtml(data.category)}`)}
    ${emailParagraph(`<strong>Description:</strong><br/>${escapeHtml(data.description)}`)}
    ${emailButton(appUrl(`/admin/reports/${data.reportId}`), "Review in admin panel")}
  `);

  return { subject: "[Admin] New incident report on HanapKalinga", html };
}
