import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { AIWorkspaceClient } from "./ai-client";

export const dynamic = "force-dynamic";

export default async function AIPage() {
  const { member, workspaceId } = await requireMember();

  const [approvalCount, activeCount] = await Promise.all([
    prisma.contentItem.count({ where: { workspaceId, stage: { in: [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL] } } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { notIn: [Stage.PUBLISHED, Stage.ARCHIVED] } } }),
  ]);

  return (
    <AppShell
      title="AI Workspace"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={activeCount}
      approvalCount={approvalCount}
    >
      <AIWorkspaceClient workspaceName={member.workspace.name} />
    </AppShell>
  );
}
