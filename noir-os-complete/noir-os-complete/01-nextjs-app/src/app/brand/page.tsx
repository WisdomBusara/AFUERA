import Link from "next/link";
import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Check, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

type Color = { name: string; hex: string };
type Rule = { title: string; detail: string };

export default async function BrandKitPage() {
  const { member, workspaceId } = await requireMember();

  const [kit, approvalCount, activeCount] = await Promise.all([
    prisma.brandKit.findUnique({ where: { workspaceId } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { in: [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL] } } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { notIn: [Stage.PUBLISHED, Stage.ARCHIVED] } } }),
  ]);

  const shell = {
    title: "Brand Kit",
    workspaceName: member.workspace.name,
    user: { name: member.name, initials: member.initials, color: member.color, role: member.role },
    boardCount: activeCount,
    approvalCount,
  };

  if (!kit) {
    return (
      <AppShell {...shell}>
        <div className="px-6 py-16 text-center text-[13px] text-[var(--afa-ink-3)]">
          No brand kit yet. Run <code className="mono">npm run db:seed</code> to create one.
        </div>
      </AppShell>
    );
  }

  const colors = (Array.isArray(kit.colors) ? kit.colors : []) as unknown as Color[];
  const rules = (Array.isArray(kit.voiceRules) ? kit.voiceRules : []) as unknown as Rule[];

  return (
    <AppShell {...shell}>
      <div className="mx-auto max-w-4xl px-6 py-5 md:px-[26px]">
        {/* Colour */}
        <div className="afa-panel mb-4 p-6">
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--afa-ink-3)]">Colour</div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {colors.map((c) => (
              <div key={c.name}>
                <div className="h-[70px] rounded-xl" style={{ background: c.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.05)" }} />
                <div className="mt-2 flex items-center justify-between text-[12px]">
                  <b className="font-semibold">{c.name}</b>
                  <span className="mono text-[var(--afa-ink-3)]">{c.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          {/* Typography */}
          <div className="afa-panel p-6">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--afa-ink-3)]">Typography</div>
            <div className="text-[30px] font-bold tracking-tight" style={{ letterSpacing: "-0.03em" }}>Made for the outdoors</div>
            <div className="mt-1 text-[13px] text-[var(--afa-ink-2)]">Display · {kit.fontDisplay}</div>
            <div className="mt-5 text-[15px] leading-relaxed">
              Body copy stays warm, direct, and plainspoken — like advice from someone who&apos;s actually been up the mountain.
            </div>
            <div className="mt-1 text-[13px] text-[var(--afa-ink-2)]">Body · {kit.fontBody}</div>
          </div>

          {/* Voice & tone */}
          <div className="afa-panel p-6">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--afa-ink-3)]">Voice &amp; tone</div>
            {rules.map((r) => (
              <div key={r.title} className="flex gap-2.5 border-t border-[var(--afa-line-2)] py-2.5 first:border-t-0">
                <Check size={16} className="mt-0.5 flex-none text-[var(--afa-ok)]" />
                <div>
                  <b className="text-[13px]">{r.title}</b>
                  <div className="mt-0.5 text-[12.5px] text-[var(--afa-ink-2)]">{r.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Hashtags */}
          <div className="afa-panel p-6">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--afa-ink-3)]">Approved hashtags</div>
            <div className="flex flex-wrap gap-2">
              {kit.hashtags.map((t) => (
                <span key={t} className="rounded-full bg-[var(--afa-accent-soft)] px-2.5 py-1 text-[12px] font-semibold text-[var(--afa-accent-ink)]">{t}</span>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="afa-panel p-6">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--afa-ink-3)]">Legal disclaimer</div>
            <p className="m-0 text-[12.5px] leading-relaxed text-[var(--afa-ink-2)]">{kit.legalDisclaimer}</p>
          </div>
        </div>

        <Link href="/ai" className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: "#FF6F91" }}>
          <Sparkles size={14} /> The AI Workspace follows this kit automatically when it generates content.
        </Link>
      </div>
    </AppShell>
  );
}
