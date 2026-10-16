import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ViewSwitcher } from "@/components/view-switcher";
import { BoardClient } from "./board-client";
import { APPROVAL_STAGES } from "@/lib/constants";
import type { CardDTO } from "@/lib/types";
import { Filter, Layers, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

// Reads the DB at request time, scoped to the caller's workspace.
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const { member, workspaceId } = await requireMember();

  const [items, members, campaigns] = await Promise.all([
    prisma.contentItem.findMany({
      where: { workspaceId },
      orderBy: [{ stage: "asc" }, { position: "asc" }],
      include: {
        campaign: { select: { id: true, name: true, color: true } },
        owner: { select: { id: true, name: true, initials: true, color: true } },
      },
    }),
    prisma.member.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } }),
    prisma.campaign.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } }),
  ]);

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
        <button className="inline-flex items-center gap-1.5 rounded-[9px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-2)]">
          <Filter size={13} /> Filter
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-[9px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-2)]">
          <Layers size={13} /> Group: Stage
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-[9px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-2)]">
          Saved views <ChevronDown size={13} />
        </button>
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
