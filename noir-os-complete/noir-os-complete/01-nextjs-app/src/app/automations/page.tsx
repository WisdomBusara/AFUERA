import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { AutomationsClient, type RuleDTO } from "./automations-client";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const { member, workspaceId } = await requireMember();

  const [rules, approvalCount, activeCount] = await Promise.all([
    prisma.automationRule.findMany({ where: { workspaceId }, orderBy: { order: "asc" } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { in: [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL] } } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { notIn: [Stage.PUBLISHED, Stage.ARCHIVED] } } }),
  ]);

  const dto: RuleDTO[] = rules.map((r) => ({
    id: r.id,
    name: r.name,
    enabled: r.enabled,
    trigger: r.trigger,
    triggerStage: r.triggerStage,
    action: r.action,
    actionStage: r.actionStage,
  }));

  return (
    <AppShell
      title="Automation"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={activeCount}
      approvalCount={approvalCount}
    >
      <AutomationsClient initial={dto} />
    </AppShell>
  );
}
