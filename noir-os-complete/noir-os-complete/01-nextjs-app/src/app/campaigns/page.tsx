import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { STAGES, APPROVAL_STAGES, TERMINAL_STAGES } from "@/lib/constants";
import { CampaignsClient, type CampaignDTO } from "./campaigns-client";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const { member, workspaceId } = await requireMember();

  const [campaigns, items] = await Promise.all([
    prisma.campaign.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } }),
    prisma.contentItem.findMany({
      where: { workspaceId },
      select: {
        campaignId: true, stage: true,
        owner: { select: { id: true, name: true, initials: true, color: true } },
      },
    }),
  ]);

  const approvalCount = items.filter((i) => APPROVAL_STAGES.includes(i.stage)).length;
  const activeCount = items.filter((i) => !TERMINAL_STAGES.includes(i.stage)).length;

  // Every number on a campaign card is derived from its real content items.
  const dtos: CampaignDTO[] = campaigns.map((c) => {
    const list = items.filter((i) => i.campaignId === c.id);
    return {
      id: c.id,
      name: c.name,
      color: c.color,
      objective: c.objective,
      endDate: c.endDate ? c.endDate.toISOString() : null,
      total: list.length,
      inReview: list.filter((i) => APPROVAL_STAGES.includes(i.stage)).length,
      scheduled: list.filter((i) => i.stage === Stage.SCHEDULED).length,
      published: list.filter((i) => i.stage === Stage.PUBLISHED).length,
      dist: STAGES.map((s) => ({ label: s.label, color: s.color, value: list.filter((i) => i.stage === s.key).length }))
        .filter((d) => d.value > 0),
      owners: Array.from(new Map(list.map((i) => [i.owner.id, i.owner])).values()),
    };
  });

  return (
    <AppShell
      title="Campaigns"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={activeCount}
      approvalCount={approvalCount}
    >
      <CampaignsClient initial={dtos} />
    </AppShell>
  );
}
