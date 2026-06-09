import { sendEmail, type SendEmailInput } from "@/lib/email/send";

export function sendEmailSafe(input: SendEmailInput): void {
  void sendEmail(input).catch((error) => {
    console.error("[email] send failed:", error instanceof Error ? error.message : error);
  });
}
