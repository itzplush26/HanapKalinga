import { Resend } from "resend";
import { sendMail } from "@/lib/email/send-mail";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "no-reply@hanapkalinga.com";
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && getFromEmail());
}

export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; error?: string }> {
  const resend = getResendClient();
  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: getFromEmail(),
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text
      });

      if (error) {
        return { sent: false, error: error.message };
      }

      return { sent: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send email.";
      return { sent: false, error: message };
    }
  }

  return sendMail({
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text ?? input.subject
  });
}
