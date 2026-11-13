import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ViewSwitcher } from "@/components/view-switcher";
import { BoardClient } from "./board-client";
import { APPROVAL_STAGES } from "@/lib/constants";
import { cardInclude, toCardDTO } from "@/lib/cards";
import { Avatar } from "@/components/ui/avatar";

// Reads the DB at request time, scoped to the caller's workspace.
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const { member, workspaceId } = await requireMember();

  const [items, members, campaigns] = await Promise.all([
    prisma.contentItem.findMany({
      where: { workspaceId },
      orderBy: [{ stage: "asc" }, { position: "asc" }],
      include: cardInclude,
    }),
    prisma.member.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } }),
    prisma.campaign.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } }),
  ]);

  const cards = items.map(toCardDTO);

  const active = cards.filter((c) => c.stage !== Stage.PUBLISHED && c.stage !== Stage.ARCHIVED).length;
  const approvals = cards.filter((c) => APPROVAL_STAGES.includes(c.stage)).length;

  return (
    <AppShell
      title="Content board"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={active}
      approvalCount={approvals}
      rightSlot={<ViewSwitcher />}
    >
      <div className="flex flex-wrap items-center gap-3 px-[26px] pb-1.5 pt-4">
        <span className="afa-meta">{cards.length} {cards.length === 1 ? "card" : "cards"} · drag to move between stages</span>
        <div className="ml-auto flex">
          {members.slice(0, 6).map((m, k) => (
            <div key={m.id} style={{ marginLeft: k ? -8 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--afa-surface)" }}>
              <Avatar initials={m.initials} color={m.color} size={26} name={m.name} />
            </div>
          ))}
        </div>
      </div>

      <BoardClient
        initialCards={cards}
        campaigns={campaigns.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
        members={members.map((m) => ({ id: m.id, name: m.name, initials: m.initials, color: m.color }))}
      />
    </AppShell>
  );
}
