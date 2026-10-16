import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { HubClient } from "./hub-client";
import { APPROVAL_STAGES, TERMINAL_STAGES } from "@/lib/constants";
import type { CardDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HubPage() {
  const { member, workspaceId } = await requireMember();

  const items = await prisma.contentItem.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    include: {
      campaign: { select: { id: true, name: true, color: true } },
      owner: { select: { id: true, name: true, initials: true, color: true } },
    },
  });

  const cards: CardDTO[] = items.map((i) => ({
    id: i.id,
    title: i.title,
    type: i.type,
    channel: i.channel,
    stage: i.stage,
    position: i.position,
    priority: i.priority,
    aiScore: i.aiScore,
    comments: i.comments,
    attachments: i.attachments,
    dueDate: i.dueDate ? i.dueDate.toISOString() : null,
    publishAt: i.publishAt ? i.publishAt.toISOString() : null,
    campaign: i.campaign,
    owner: i.owner,
  }));

  const approvalCount = cards.filter((c) => APPROVAL_STAGES.includes(c.stage)).length;
  const activeCount = cards.filter((c) => !TERMINAL_STAGES.includes(c.stage)).length;

  return (
    <AppShell
      title="Content Hub"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={activeCount}
      approvalCount={approvalCount}
    >
      <HubClient initial={cards} />
    </AppShell>
  );
}
