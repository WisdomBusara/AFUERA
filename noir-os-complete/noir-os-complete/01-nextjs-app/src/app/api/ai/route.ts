import { type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionMember } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

const ROLE = `You are Afuera's built-in assistant for a marketing content team. You help draft captions, generate hashtags, rewrite copy, write content briefs, plan calendars, and reason about the team's pipeline. Be concise, practical, and specific. When you draft social copy, keep it tight and ready to post.`;

const DEFAULT_BRAND_VOICE = `BRAND VOICE:
- Warm, not corporate. Plain, specific words. Confident without boasting.
- Never make absolute guarantees.
Follow this voice whenever you generate content.`;

// Builds the brand-voice section of the system prompt from the workspace's Brand Kit.
async function buildBrandVoice(workspaceId: string, workspaceName: string) {
  const kit = await prisma.brandKit.findUnique({ where: { workspaceId } });
  if (!kit) return DEFAULT_BRAND_VOICE;
  const rules = (Array.isArray(kit.voiceRules) ? kit.voiceRules : []) as unknown as { title: string; detail: string }[];
  const ruleLines = rules.map((r) => `- ${r.title}: ${r.detail}`).join("\n");
  return `BRAND VOICE — "${workspaceName}":
${kit.voiceSummary}
${ruleLines}
Approved hashtags: ${kit.hashtags.join(" ")}.
Legal: ${kit.legalDisclaimer}
Follow this voice whenever you generate content.`;
}

// Compact, live snapshot of the workspace so the assistant can reason about real data.
async function buildContext(workspaceId: string, workspaceName: string) {
  const [byStage, campaigns, upcoming] = await Promise.all([
    prisma.contentItem.groupBy({ by: ["stage"], where: { workspaceId }, _count: { _all: true } }),
    prisma.campaign.findMany({ where: { workspaceId }, select: { name: true, status: true, health: true } }),
    prisma.contentItem.findMany({
      where: { workspaceId, stage: Stage.SCHEDULED, publishAt: { not: null } },
      orderBy: { publishAt: "asc" }, take: 5,
      select: { title: true, channel: true, publishAt: true },
    }),
  ]);

  const stageLine = byStage.map((s) => `${s.stage.toLowerCase()} ${s._count._all}`).join(", ") || "empty";
  const campLine = campaigns.map((c) => `${c.name} (${c.health}% health, ${c.status})`).join("; ") || "none";
  const upLine = upcoming
    .map((u) => `"${u.title}" — ${u.channel} on ${u.publishAt!.toISOString().slice(0, 10)}`)
    .join("; ") || "nothing scheduled";

  return `LIVE WORKSPACE CONTEXT for "${workspaceName}":
- Pipeline by stage: ${stageLine}
- Campaigns: ${campLine}
- Next scheduled: ${upLine}
When the user asks about their pipeline, schedule, or campaigns, use these figures and do not invent numbers beyond them.`;
}

export async function POST(req: NextRequest) {
  const session = await getSessionMember();
  if (!session?.workspaceId) return new Response("Unauthorized", { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "The AI Workspace isn't configured yet. Add ANTHROPIC_API_KEY to your environment (see README) and restart the dev server.",
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const incoming: unknown[] = Array.isArray(body?.messages) ? body.messages : [];
  const messages = incoming
    .filter((m): m is { role: "user" | "assistant"; content: string } =>
      !!m && typeof m === "object" &&
      ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant") &&
      typeof (m as { content?: unknown }).content === "string")
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content }));

  if (messages.length === 0) return new Response("No messages", { status: 400 });

  const [brandVoice, context] = await Promise.all([
    buildBrandVoice(session.workspaceId, session.member.workspace.name),
    buildContext(session.workspaceId, session.member.workspace.name),
  ]);
  const system = `${ROLE}\n\n${brandVoice}\n\n${context}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const msgStream = client.messages.stream({ model: MODEL, max_tokens: 1024, system, messages });
        for await (const event of msgStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n[The assistant hit an error — check your ANTHROPIC_API_KEY and that your account has access to the model.]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
  });
}
