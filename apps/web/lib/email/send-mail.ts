import nodemailer from "nodemailer";

interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST ?? "smtp.resend.com";
  const port = Number(process.env.SMTP_PORT ?? "465");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;

  if (!user || !pass || !from) {
    return null;
  }

  return { host, port, user, pass, from };
}

export function isEmailConfigured(): boolean {
  return getSmtpConfig() !== null;
}

export async function sendMail(input: SendMailInput): Promise<{ sent: boolean; error?: string }> {
  const config = getSmtpConfig();
  if (!config) {
    return { sent: false, error: "SMTP is not configured." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });

    await transporter.sendMail({
      from: config.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, "<br/>")
    });

    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email.";
    return { sent: false, error: message };
  }
}
