import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBriefData, renderBriefHtml } from "@/lib/brief";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily check-in. Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY not set" }, { status: 200 });
  }

  // Everyone who has linked an email address gets their own workspace's brief.
  const members = await prisma.member.findMany({
    where: { email: { not: null } },
    select: { name: true, email: true, workspaceId: true },
  });

  let sent = 0;
  const errors: string[] = [];
  for (const m of members) {
    if (!m.email) continue;
    try {
      const data = await getBriefData(m.workspaceId);
      const html = renderBriefHtml(m.name, data);
      const subject = `Your Noir OS brief — ${data.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      const res = await sendEmail(m.email, subject, html);
      if (res.ok) sent++;
      else errors.push(`${m.email}: ${res.error}`);
    } catch (e) {
      errors.push(`${m.email}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  return NextResponse.json({ ok: true, recipients: members.length, sent, errors });
}
