"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionMember } from "@/lib/auth";
import { STAGES } from "@/lib/constants";

async function authorize(cardId: string) {
  const session = await getSessionMember();
  if (!session?.workspaceId) throw new Error("Not authenticated");
  const card = await prisma.contentItem.findUnique({
    where: { id: cardId },
    select: { workspaceId: true, stage: true, publishAt: true, dueDate: true },
  });
  if (!card || card.workspaceId !== session.workspaceId) throw new Error("Not found");
  return { workspaceId: session.workspaceId, card };
}

// New cards enter a column at the top.
async function topPosition(workspaceId: string, stage: Stage) {
  const top = await prisma.contentItem.findFirst({
    where: { workspaceId, stage },
    orderBy: { position: "asc" },
    select: { position: true },
  });
  return (top?.position ?? 1000) - 1000;
}

function revalidateAll() {
  revalidatePath("/approvals");
  revalidatePath("/board");
  revalidatePath("/board/calendar");
  revalidatePath("/dashboard");
}

const idSchema = z.object({ cardId: z.string().min(1) });

// Approve = advance one stage down the lifecycle (thin wrapper over a stage move).
export async function approveItem(input: z.infer<typeof idSchema>) {
  const { cardId } = idSchema.parse(input);
  const { workspaceId, card } = await authorize(cardId);

  const idx = STAGES.findIndex((s) => s.key === card.stage);
  const next = STAGES[idx + 1] ?? STAGES[idx];
  const position = await topPosition(workspaceId, next.key);

  await prisma.contentItem.update({ where: { id: cardId }, data: { stage: next.key, position } });
  if ((next.key === Stage.SCHEDULED || next.key === Stage.PUBLISHED) && !card.publishAt) {
    await prisma.contentItem.update({ where: { id: cardId }, data: { publishAt: card.dueDate } });
  }

  revalidateAll();
  return { ok: true as const, stage: next.key };
}

// Request changes = send it back to Writing.
export async function requestChanges(input: z.infer<typeof idSchema>) {
  const { cardId } = idSchema.parse(input);
  const { workspaceId } = await authorize(cardId);
  const position = await topPosition(workspaceId, Stage.WRITING);

  await prisma.contentItem.update({ where: { id: cardId }, data: { stage: Stage.WRITING, position } });
  revalidateAll();
  return { ok: true as const };
}
