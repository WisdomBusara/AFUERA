"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionMember } from "@/lib/auth";

const PALETTE = ["#2E63F6", "#EC4899", "#8B5CF6", "#0EA5A4", "#F79009", "#12B76A"];

// First letters of up to two words, e.g. "Sam Okafor" → "SO". Mirrors auth.ts.
function initialsFrom(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

// A valid email, "" or null (to clear it), or omitted.
const emailField = z.union([z.string().email().max(160), z.literal(""), z.null()]).optional();

async function requireSession() {
  const s = await getSessionMember();
  if (!s?.workspaceId) throw new Error("Not authenticated");
  return s;
}

// Confirms the member row exists and belongs to the caller's workspace.
async function authorizeMember(id: string, workspaceId: string) {
  const m = await prisma.member.findUnique({ where: { id }, select: { workspaceId: true } });
  if (!m || m.workspaceId !== workspaceId) throw new Error("Not found");
}

const createSchema = z.object({
  name: z.string().min(1, "Add a name").max(80),
  role: z.string().min(1).max(60),
  color: z.string().max(9).optional(),
  email: emailField,
});

export async function createMember(input: z.infer<typeof createSchema>) {
  const data = createSchema.parse(input);
  const { workspaceId } = await requireSession();
  const color = data.color || PALETTE[Math.floor(Math.random() * PALETTE.length)];

  const member = await prisma.member.create({
    data: {
      name: data.name,
      initials: initialsFrom(data.name),
      color,
      role: data.role,
      email: data.email || null,
      online: false,
      // Roster profile not yet tied to a login. `authUserId` is required + unique, so we
      // stamp a placeholder; a real sign-up provisions its own member via getSessionMember.
      authUserId: `manual_${randomUUID()}`,
      workspaceId,
    },
  });

  revalidatePath("/team");
  return { ok: true as const, id: member.id, initials: member.initials, color };
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80).optional(),
  role: z.string().min(1).max(60).optional(),
  color: z.string().max(9).optional(),
  email: emailField,
  online: z.boolean().optional(),
});

export async function updateMember(input: z.infer<typeof updateSchema>) {
  const data = updateSchema.parse(input);
  const { workspaceId } = await requireSession();
  await authorizeMember(data.id, workspaceId);

  await prisma.member.update({
    where: { id: data.id },
    data: {
      // Name drives the initials, so keep them in sync.
      ...(data.name !== undefined ? { name: data.name, initials: initialsFrom(data.name) } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
      ...(data.online !== undefined ? { online: data.online } : {}),
    },
  });

  revalidatePath("/team");
  return { ok: true as const };
}

export async function deleteMember(input: { id: string }) {
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const session = await requireSession();
  await authorizeMember(id, session.workspaceId);

  // Guard rails: you can't remove yourself, and a member who still owns content would
  // orphan those cards (the owner relation has no cascade), so make the user reassign first.
  if (id === session.member.id) {
    return { ok: false as const, error: "You can't remove yourself." };
  }
  const owned = await prisma.contentItem.count({ where: { ownerId: id } });
  if (owned > 0) {
    return {
      ok: false as const,
      error: `This member owns ${owned} content item${owned === 1 ? "" : "s"}. Reassign them first.`,
    };
  }

  await prisma.member.delete({ where: { id } });
  revalidatePath("/team");
  return { ok: true as const };
}
