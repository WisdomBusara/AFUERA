import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { AssetsClient, type AssetDTO } from "./assets-client";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const { member, workspaceId } = await requireMember();

  const [assets, approvalCount, activeCount] = await Promise.all([
    prisma.asset.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { in: [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL] } } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { notIn: [Stage.PUBLISHED, Stage.ARCHIVED] } } }),
  ]);

  const dto: AssetDTO[] = assets.map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    mimeType: a.mimeType,
    path: a.path,
    size: a.size,
    uploaderName: a.uploaderName,
  }));

  return (
    <AppShell
      title="Asset Library"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={activeCount}
      approvalCount={approvalCount}
    >
      <AssetsClient initial={dto} workspaceId={workspaceId} />
    </AppShell>
  );
}
