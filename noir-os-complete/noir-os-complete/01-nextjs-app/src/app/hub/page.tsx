import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { HubClient } from "./hub-client";
import { APPROVAL_STAGES, TERMINAL_STAGES } from "@/lib/constants";
import { cardInclude, toCardDTO } from "@/lib/cards";

export const dynamic = "force-dynamic";

export default async function HubPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { member, workspaceId } = await requireMember();

  const items = await prisma.contentItem.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    include: cardInclude,
  });

  const cards = items.map(toCardDTO);

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
      <HubClient initial={cards} initialQuery={typeof q === "string" ? q : ""} />
    </AppShell>
  );
}
