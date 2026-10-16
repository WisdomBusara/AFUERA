import { Resend } from "resend";

const FROM = process.env.NOIR_FROM_EMAIL ?? "Noir OS <onboarding@resend.dev>";

// Sends an email via Resend. No-ops gracefully (returns ok:false) when unconfigured,
// so the rest of the app keeps working without an email provider set up.
export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false as const, error: "RESEND_API_KEY is not set." };
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Email failed." };
  }
}
