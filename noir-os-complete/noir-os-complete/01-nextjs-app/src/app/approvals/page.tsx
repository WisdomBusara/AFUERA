import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ApprovalsClient } from "./approvals-client";
import type { CardDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const APPROVAL_STAGES: Stage[] = [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL];

export default async function ApprovalsPage() {
  const { member, workspaceId } = await requireMember();

  const items = await prisma.contentItem.findMany({
    where: { workspaceId, stage: { in: APPROVAL_STAGES } },
    orderBy: [{ stage: "desc" }, { dueDate: "asc" }],
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

  const activeCount = await prisma.contentItem.count({
    where: { workspaceId, stage: { notIn: [Stage.PUBLISHED, Stage.ARCHIVED] } },
  });

  return (
    <AppShell
      title="Approval Center"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={activeCount}
      approvalCount={cards.length}
    >
      <ApprovalsClient initial={cards} />
    </AppShell>
  );
}
