import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { APPROVAL_STAGES, TERMINAL_STAGES } from "@/lib/constants";
import { BrandClient } from "./brand-client";
import type { BrandKitInput } from "./actions";

export const dynamic = "force-dynamic";

type Color = { name: string; hex: string };
type Rule = { title: string; detail: string };

export default async function BrandKitPage() {
  const { member, workspaceId } = await requireMember();

  const [kit, approvalCount, activeCount] = await Promise.all([
    prisma.brandKit.findUnique({ where: { workspaceId } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { in: APPROVAL_STAGES } } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { notIn: TERMINAL_STAGES } } }),
  ]);

  const initial: BrandKitInput = {
    colors: (Array.isArray(kit?.colors) ? kit.colors : []) as unknown as Color[],
    fontDisplay: kit?.fontDisplay ?? "",
    fontBody: kit?.fontBody ?? "",
    voiceRules: (Array.isArray(kit?.voiceRules) ? kit.voiceRules : []) as unknown as Rule[],
    hashtags: kit?.hashtags ?? [],
    legalDisclaimer: kit?.legalDisclaimer ?? "",
    voiceSummary: kit?.voiceSummary ?? "",
  };

  return (
    <AppShell
      title="Brand Kit"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={activeCount}
      approvalCount={approvalCount}
    >
      <BrandClient initial={initial} isNew={!kit} />
    </AppShell>
  );
}
