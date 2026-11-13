import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ViewSwitcher } from "@/components/view-switcher";
import { CalendarClient } from "./calendar-client";
import { cardInclude, toCardDTO } from "@/lib/cards";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { member, workspaceId } = await requireMember();

  const items = await prisma.contentItem.findMany({
    where: { workspaceId, publishAt: { not: null } },
    orderBy: { publishAt: "asc" },
    include: cardInclude,
  });

  const cards = items.map(toCardDTO);

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
