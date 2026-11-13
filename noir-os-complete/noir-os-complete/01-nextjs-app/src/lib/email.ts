import nodemailer from "nodemailer";

const FROM = process.env.MAIL_FROM ?? "Noir OS <info@afuera.wisdombusara.com>";

export function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Sends an email over SMTP (Brevo relay in production). No-ops gracefully (returns
// ok:false) when unconfigured, so the rest of the app keeps working without it.
export async function sendEmail(to: string, subject: string, html: string) {
  if (!emailConfigured()) {
    return { ok: false as const, error: "Email is not configured (SMTP_HOST / SMTP_USER / SMTP_PASS)." };
  }
  try {
    const port = Number(process.env.SMTP_PORT ?? 587);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 587 upgrades with STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({ from: FROM, to, subject, html });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Email failed." };
  }
}
