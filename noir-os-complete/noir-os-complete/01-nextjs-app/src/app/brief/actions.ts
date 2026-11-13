"use server";

import { getSessionMember } from "@/lib/auth";
import { getBriefData, renderBriefHtml } from "@/lib/brief";
import { sendEmail } from "@/lib/email";

// Sends the signed-in user their brief right now (manual check-in).
export async function sendDailyBrief() {
  const session = await getSessionMember();
  if (!session?.workspaceId) return { ok: false as const, error: "Not authenticated." };

  const to = session.user.email;
  if (!to) return { ok: false as const, error: "No email address on your account." };

  const data = await getBriefData(session.workspaceId);
  const html = renderBriefHtml(session.member.name, data);
  const subject = `Your Noir OS brief — ${data.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const res = await sendEmail(to, subject, html);
  if (!res.ok) return { ok: false as const, error: res.error };
  return { ok: true as const, to };
}
