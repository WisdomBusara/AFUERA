import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { APPROVAL_STAGES, TERMINAL_STAGES } from "@/lib/constants";
import { TeamClient, type MemberDTO } from "./team-client";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { member, workspaceId } = await requireMember();

  const [members, approvalCount, activeCount] = await Promise.all([
    prisma.member.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.contentItem.count({ where: { workspaceId, stage: { in: APPROVAL_STAGES } } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { notIn: TERMINAL_STAGES } } }),
  ]);

  const dtos: MemberDTO[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    initials: m.initials,
    color: m.color,
    role: m.role,
    email: m.email,
    online: m.online,
    // A member is "linked" once a real sign-up owns it; seed_/manual_ rows are roster-only.
    linked: !m.authUserId.startsWith("manual_") && !m.authUserId.startsWith("seed_"),
    owned: m._count.items,
    isSelf: m.id === member.id,
  }));

  return (
    <AppShell
      title="Team"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={activeCount}
      approvalCount={approvalCount}
    >
      <TeamClient initialMembers={dtos} />
    </AppShell>
  );
}
