import { emailHeading, emailParagraph, escapeHtml, wrapEmailHtml } from "./layout";

export interface ReviewSubmittedData {
  nurseName: string;
  rating: number;
  comment?: string | null;
}

export function reviewSubmittedEmail(data: ReviewSubmittedData) {
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
  const commentBlock = data.comment
    ? emailParagraph(`<em>"${escapeHtml(data.comment)}"</em>`)
    : "";

  const html = wrapEmailHtml(`
    ${emailHeading(`You received a new review, ${escapeHtml(data.nurseName)}!`)}
    ${emailParagraph(`<span style="color:#f59e0b;font-size:18px;">${stars}</span> (${data.rating}/5)`)}
    ${commentBlock}
    ${emailParagraph("Thank you for providing trusted care on HanapKalinga. Keep up the great work!")}
  `);

  return { subject: "You received a new review on HanapKalinga", html };
}
