import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ApprovalsClient } from "./approvals-client";
import { cardInclude, toCardDTO } from "@/lib/cards";

export const dynamic = "force-dynamic";

const APPROVAL_STAGES: Stage[] = [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL];

export default async function ApprovalsPage() {
  const { member, workspaceId } = await requireMember();

  const items = await prisma.contentItem.findMany({
    where: { workspaceId, stage: { in: APPROVAL_STAGES } },
    orderBy: [{ stage: "desc" }, { dueDate: "asc" }],
    include: cardInclude,
  });

  const cards = items.map(toCardDTO);

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
