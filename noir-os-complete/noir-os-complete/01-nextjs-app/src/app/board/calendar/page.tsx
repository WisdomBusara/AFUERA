import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ViewSwitcher } from "@/components/view-switcher";
import { CalendarClient } from "./calendar-client";
import type { CardDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { member, workspaceId } = await requireMember();

  const items = await prisma.contentItem.findMany({
    where: { workspaceId, publishAt: { not: null } },
    orderBy: { publishAt: "asc" },
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

  const approvals = await prisma.contentItem.count({
    where: { workspaceId, stage: { in: [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL] } },
  });
  const active = await prisma.contentItem.count({
    where: { workspaceId, stage: { notIn: [Stage.PUBLISHED, Stage.ARCHIVED] } },
  });

  return (
    <AppShell
      title="Content board"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={active}
      approvalCount={approvals}
      rightSlot={<ViewSwitcher />}
    >
      <CalendarClient initialCards={cards} />
    </AppShell>
  );
}
