import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ProjectsClient, type ProjectDTO, type TaskDTO } from "./projects-client";

export const dynamic = "force-dynamic";

type Prio = "Low" | "Medium" | "High";

export default async function ProjectsPage() {
  const { member, workspaceId } = await requireMember();

  const [projects, looseTasks, approvalCount, activeCount] = await Promise.all([
    prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
      include: { tasks: { orderBy: { position: "asc" } } },
    }),
    prisma.task.findMany({ where: { workspaceId, projectId: null }, orderBy: { position: "asc" } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { in: [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL] } } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { notIn: [Stage.PUBLISHED, Stage.ARCHIVED] } } }),
  ]);

  const projectDTOs: ProjectDTO[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    status: p.status as ProjectDTO["status"],
    dueDate: p.dueDate ? p.dueDate.toISOString() : null,
    tasks: p.tasks.map((t) => ({
      id: t.id, title: t.title, done: t.done, priority: t.priority as Prio,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null, projectId: t.projectId,
    })),
  }));

  const looseDTOs: TaskDTO[] = looseTasks.map((t) => ({
    id: t.id, title: t.title, done: t.done, priority: t.priority as Prio,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null, projectId: t.projectId,
  }));

  return (
    <AppShell
      title="Projects"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={activeCount}
      approvalCount={approvalCount}
    >
      <ProjectsClient initialProjects={projectDTOs} initialLoose={looseDTOs} />
    </AppShell>
  );
}
