import { appUrl, emailButton, emailHeading, emailParagraph, escapeHtml, wrapEmailHtml } from "./layout";

interface CareRequestExpiredEmailInput {
  familyName: string;
  title: string;
  city: string | null;
}

export function careRequestExpiredEmail(input: CareRequestExpiredEmailInput) {
  const browseUrl = appUrl("/dashboard/family/care-requests/new");
  const location = input.city?.trim() ? ` in ${escapeHtml(input.city)}` : "";
  const html = wrapEmailHtml(`
    ${emailHeading("Your care request has expired")}
    ${emailParagraph(
      `Hi ${escapeHtml(input.familyName)}, your care request "<strong>${escapeHtml(input.title)}</strong>"${location} has reached its expiry date and is now closed.`
    )}
    ${emailParagraph("You can post a new request anytime to continue receiving applications from nurses and caregivers.")}
    ${emailButton(browseUrl, "Post a new care request")}
  `);

  return {
    subject: "Your HanapKalinga care request has expired",
    html
  };
}
