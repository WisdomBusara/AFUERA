"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Stage, ContentType, Channel, Priority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionMember } from "@/lib/auth";
import { runStageAutomations } from "@/lib/automations";

// Ensures the caller is signed in and the card belongs to their workspace.
async function authorizeCard(cardId: string) {
  const session = await getSessionMember();
  if (!session?.workspaceId) throw new Error("Not authenticated");
  const card = await prisma.contentItem.findUnique({
    where: { id: cardId },
    select: { workspaceId: true, publishAt: true, dueDate: true },
  });
  if (!card || card.workspaceId !== session.workspaceId) throw new Error("Not found");
  return { session, card };
}

const moveSchema = z.object({
  cardId: z.string().min(1),
  toStage: z.nativeEnum(Stage),
  position: z.number().finite(),
});

/**
 * Persist a card's column + order. `position` is a fractional index computed on
 * the client from its new neighbours, so a single-row update keeps ordering
 * stable without renumbering the whole column.
 */
export async function moveCard(input: z.infer<typeof moveSchema>) {
  const { cardId, toStage, position } = moveSchema.parse(input);
  const { session, card } = await authorizeCard(cardId);

  await prisma.contentItem.update({
    where: { id: cardId },
    data: { stage: toStage, position },
  });

  // Entering a scheduling stage seeds publishAt from the due date, only if unset.
  if ((toStage === Stage.SCHEDULED || toStage === Stage.PUBLISHED) && !card.publishAt) {
    await prisma.contentItem.update({ where: { id: cardId }, data: { publishAt: card.dueDate } });
  }

  // Event-driven automations may advance the card further.
  const finalStage = await runStageAutomations(session.workspaceId, cardId, toStage);

  revalidatePath("/board");
  revalidatePath("/board/calendar");
  return { ok: true as const, stage: finalStage };
}

const rescheduleSchema = z.object({
  cardId: z.string().min(1),
  publishAt: z.string().datetime().nullable(),
});

export async function rescheduleCard(input: z.infer<typeof rescheduleSchema>) {
  const { cardId, publishAt } = rescheduleSchema.parse(input);
  await authorizeCard(cardId);

  await prisma.contentItem.update({
    where: { id: cardId },
    data: { publishAt: publishAt ? new Date(publishAt) : null },
  });

  revalidatePath("/board");
  revalidatePath("/board/calendar");
  return { ok: true as const };
}

const createSchema = z.object({
  title: z.string().min(1, "Add a title").max(160),
  stage: z.nativeEnum(Stage),
  type: z.nativeEnum(ContentType).default(ContentType.POST),
  channel: z.nativeEnum(Channel).default(Channel.INSTAGRAM),
  campaignId: z.string().min(1),
  ownerId: z.string().min(1),
});

export async function createCard(input: z.infer<typeof createSchema>) {
  const data = createSchema.parse(input);
  const session = await getSessionMember();
  if (!session?.workspaceId) throw new Error("Not authenticated");

  // Confirm the campaign is in the caller's workspace.
  const campaign = await prisma.campaign.findUnique({
    where: { id: data.campaignId },
    select: { workspaceId: true },
  });
  if (!campaign || campaign.workspaceId !== session.workspaceId) throw new Error("Invalid campaign");

  const top = await prisma.contentItem.findFirst({
    where: { stage: data.stage, workspaceId: session.workspaceId },
    orderBy: { position: "asc" },
    select: { position: true },
  });
  const position = (top?.position ?? 1000) - 1000;

  const card = await prisma.contentItem.create({
    data: {
      title: data.title,
      stage: data.stage,
      type: data.type,
      channel: data.channel,
      position,
      priority: Priority.MEDIUM,
      workspaceId: session.workspaceId,
      campaignId: data.campaignId,
      ownerId: data.ownerId,
    },
  });

  revalidatePath("/board");
  return { ok: true as const, id: card.id };
}
