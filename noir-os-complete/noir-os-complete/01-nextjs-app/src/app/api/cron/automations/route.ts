import { type NextRequest, NextResponse } from "next/server";
import { runScheduledAutomations } from "@/lib/automations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Scheduler tick for time-based automations. Called every 15 minutes by the
// afuera-automations systemd timer with `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json({ ok: true, ...(await runScheduledAutomations()) });
}
