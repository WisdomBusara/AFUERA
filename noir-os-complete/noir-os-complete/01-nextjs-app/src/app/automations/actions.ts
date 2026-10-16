"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionMember } from "@/lib/auth";

async function requireWorkspace() {
  const s = await getSessionMember();
  if (!s?.workspaceId) throw new Error("Not authenticated");
  return s.workspaceId;
}

async function ensureOwned(id: string, workspaceId: string) {
  const rule = await prisma.automationRule.findUnique({ where: { id }, select: { workspaceId: true } });
  if (!rule || rule.workspaceId !== workspaceId) throw new Error("Not found");
}

export async function toggleRule(input: { id: string; enabled: boolean }) {
  const { id, enabled } = z.object({ id: z.string().min(1), enabled: z.boolean() }).parse(input);
  const workspaceId = await requireWorkspace();
  await ensureOwned(id, workspaceId);
  await prisma.automationRule.update({ where: { id }, data: { enabled } });
  revalidatePath("/automations");
  return { ok: true as const };
}

export async function deleteRule(input: { id: string }) {
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const workspaceId = await requireWorkspace();
  await ensureOwned(id, workspaceId);
  await prisma.automationRule.delete({ where: { id } });
  revalidatePath("/automations");
  return { ok: true as const };
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  triggerStage: z.nativeEnum(Stage),
  actionStage: z.nativeEnum(Stage),
});

// New rules are the executable kind: when a card enters a stage, move it to another.
export async function createRule(input: z.infer<typeof createSchema>) {
  const data = createSchema.parse(input);
  const workspaceId = await requireWorkspace();
  const order = await prisma.automationRule.count({ where: { workspaceId } });
  const rule = await prisma.automationRule.create({
    data: {
      workspaceId,
      name: data.name,
      enabled: true,
      trigger: "CARD_ENTERS_STAGE",
      triggerStage: data.triggerStage,
      action: "MOVE_TO_STAGE",
      actionStage: data.actionStage,
      order,
    },
  });
  revalidatePath("/automations");
  return { ok: true as const, id: rule.id };
}
