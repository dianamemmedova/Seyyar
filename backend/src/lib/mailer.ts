import nodemailer from 'nodemailer';
import { config } from '../config';

export type Mail = {
  to: string;
  subject: string;
  text: string;
};

// Without SMTP settings (local development) emails are printed to the terminal instead
const transporter = config.SMTP_HOST
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
    })
  : null;

export async function sendMail(mail: Mail): Promise<void> {
  if (!transporter) {
    console.log(
      ['', '──── [mail: dev] ────', `To: ${mail.to}`, `Subject: ${mail.subject}`, '', mail.text, '────────────────────', ''].join('\n'),
    );
    return;
  }

  await transporter.sendMail({ from: config.MAIL_FROM, ...mail });
}

// The API answers immediately; a failed email is logged and never breaks the request
export function sendMailInBackground(mail: Mail): void {
  sendMail(mail).catch((error: unknown) => {
    console.error(`[mail] Göndərilmədi: ${mail.subject} -> ${mail.to}`, error);
  });
}
