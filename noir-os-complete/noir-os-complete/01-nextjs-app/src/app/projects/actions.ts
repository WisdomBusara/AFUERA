"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionMember } from "@/lib/auth";

async function requireWorkspace() {
  const s = await getSessionMember();
  if (!s?.workspaceId) throw new Error("Not authenticated");
  return s.workspaceId;
}

function revalidate() {
  revalidatePath("/projects");
  revalidatePath("/brief");
}

const isoDate = z.string().datetime().nullable().optional();

/* ── Projects ─────────────────────────────────────────────────────────────── */

const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  color: z.string().max(9).optional(),
  dueDate: isoDate,
});

export async function createProject(input: z.infer<typeof createProjectSchema>) {
  const data = createProjectSchema.parse(input);
  const workspaceId = await requireWorkspace();
  const project = await prisma.project.create({
    data: {
      workspaceId,
      name: data.name,
      color: data.color || "#2E63F6",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });
  revalidate();
  return { ok: true as const, id: project.id };
}

const updateProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  status: z.enum(["Active", "On hold", "Done"]).optional(),
  color: z.string().max(9).optional(),
  dueDate: isoDate,
});

export async function updateProject(input: z.infer<typeof updateProjectSchema>) {
  const data = updateProjectSchema.parse(input);
  const workspaceId = await requireWorkspace();
  const found = await prisma.project.findUnique({ where: { id: data.id }, select: { workspaceId: true } });
  if (!found || found.workspaceId !== workspaceId) throw new Error("Not found");
  await prisma.project.update({
    where: { id: data.id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
    },
  });
  revalidate();
  return { ok: true as const };
}

export async function deleteProject(input: { id: string }) {
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const workspaceId = await requireWorkspace();
  const found = await prisma.project.findUnique({ where: { id }, select: { workspaceId: true } });
  if (!found || found.workspaceId !== workspaceId) throw new Error("Not found");
  await prisma.project.delete({ where: { id } }); // cascade deletes its tasks
  revalidate();
  return { ok: true as const };
}

/* ── Tasks ────────────────────────────────────────────────────────────────── */

const createTaskSchema = z.object({
  title: z.string().min(1).max(240),
  projectId: z.string().min(1).nullable().optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  dueDate: isoDate,
});

export async function createTask(input: z.infer<typeof createTaskSchema>) {
  const data = createTaskSchema.parse(input);
  const workspaceId = await requireWorkspace();

  if (data.projectId) {
    const p = await prisma.project.findUnique({ where: { id: data.projectId }, select: { workspaceId: true } });
    if (!p || p.workspaceId !== workspaceId) throw new Error("Invalid project");
  }

  const top = await prisma.task.findFirst({
    where: { workspaceId, projectId: data.projectId ?? null },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      workspaceId,
      projectId: data.projectId ?? null,
      title: data.title,
      priority: data.priority ?? "Medium",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      position: (top?.position ?? 0) + 1000,
    },
  });
  revalidate();
  return { ok: true as const, id: task.id };
}

async function authorizeTask(id: string, workspaceId: string) {
  const t = await prisma.task.findUnique({ where: { id }, select: { workspaceId: true } });
  if (!t || t.workspaceId !== workspaceId) throw new Error("Not found");
}

export async function toggleTask(input: { id: string; done: boolean }) {
  const { id, done } = z.object({ id: z.string().min(1), done: z.boolean() }).parse(input);
  const workspaceId = await requireWorkspace();
  await authorizeTask(id, workspaceId);
  await prisma.task.update({ where: { id }, data: { done } });
  revalidate();
  return { ok: true as const };
}

const updateTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(240).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  dueDate: isoDate,
});

export async function updateTask(input: z.infer<typeof updateTaskSchema>) {
  const data = updateTaskSchema.parse(input);
  const workspaceId = await requireWorkspace();
  await authorizeTask(data.id, workspaceId);
  await prisma.task.update({
    where: { id: data.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
    },
  });
  revalidate();
  return { ok: true as const };
}

export async function deleteTask(input: { id: string }) {
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const workspaceId = await requireWorkspace();
  await authorizeTask(id, workspaceId);
  await prisma.task.delete({ where: { id } });
  revalidate();
  return { ok: true as const };
}
