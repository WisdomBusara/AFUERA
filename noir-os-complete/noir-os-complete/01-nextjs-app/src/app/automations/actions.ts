"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Stage, AutomationTrigger, AutomationAction } from "@prisma/client";
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

export async function renameRule(input: { id: string; name: string }) {
  const { id, name } = z.object({ id: z.string().min(1), name: z.string().trim().min(1).max(120) }).parse(input);
  const workspaceId = await requireWorkspace();
  await ensureOwned(id, workspaceId);
  await prisma.automationRule.update({ where: { id }, data: { name } });
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

const createSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    trigger: z.nativeEnum(AutomationTrigger),
    triggerStage: z.nativeEnum(Stage).nullable(),
    action: z.nativeEnum(AutomationAction),
    actionStage: z.nativeEnum(Stage).nullable(),
  })
  .superRefine((r, ctx) => {
    if (r.trigger === "CARD_ENTERS_STAGE" && !r.triggerStage) {
      ctx.addIssue({ code: "custom", message: "Pick the stage that triggers this rule." });
    }
    if (r.action === "MOVE_TO_STAGE" && !r.actionStage) {
      ctx.addIssue({ code: "custom", message: "Pick the stage to move the card to." });
    }
    if (r.trigger === "CARD_ENTERS_STAGE" && r.action === "MOVE_TO_STAGE" && r.triggerStage === r.actionStage) {
      ctx.addIssue({ code: "custom", message: "A card can't be moved to the stage it just entered." });
    }
    // Scheduled triggers re-check every 15 minutes, so their action must change the card
    // (otherwise it would fire again on every tick).
    if (r.trigger !== "CARD_ENTERS_STAGE" && r.action !== "MOVE_TO_STAGE" && r.action !== "ARCHIVE") {
      ctx.addIssue({ code: "custom", message: "Date-based rules can only move or archive content." });
    }
  });

export async function createRule(input: z.infer<typeof createSchema>) {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid rule." };
  const data = parsed.data;
  const workspaceId = await requireWorkspace();

  const order = await prisma.automationRule.count({ where: { workspaceId } });
  const rule = await prisma.automationRule.create({
    data: {
      workspaceId,
      name: data.name,
      enabled: true,
      trigger: data.trigger,
      triggerStage: data.trigger === "CARD_ENTERS_STAGE" ? data.triggerStage : null,
      action: data.action,
      actionStage: data.action === "MOVE_TO_STAGE" ? data.actionStage : null,
      order,
    },
  });
  revalidatePath("/automations");
  return { ok: true as const, id: rule.id };
}
