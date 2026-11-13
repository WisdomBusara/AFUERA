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

const updateSchema = z.object({
  cardId: z.string().min(1),
  title: z.string().min(1).max(160).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  type: z.nativeEnum(ContentType).optional(),
  channel: z.nativeEnum(Channel).optional(),
});

export async function updateCard(input: z.infer<typeof updateSchema>) {
  const { cardId, dueDate, ...rest } = updateSchema.parse(input);
  await authorizeCard(cardId);

  await prisma.contentItem.update({
    where: { id: cardId },
    data: { ...rest, ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}) },
  });

  revalidatePath("/board");
  revalidatePath("/board/calendar");
  return { ok: true as const };
}

export async function deleteCard(input: { cardId: string }) {
  const { cardId } = z.object({ cardId: z.string().min(1) }).parse(input);
  await authorizeCard(cardId);
  await prisma.contentItem.delete({ where: { id: cardId } }); // cascades comments + metrics

  revalidatePath("/board");
  revalidatePath("/board/calendar");
  return { ok: true as const };
}

/* ── Comments ─────────────────────────────────────────────────────────────── */

export async function listComments(input: { cardId: string }) {
  const { cardId } = z.object({ cardId: z.string().min(1) }).parse(input);
  await authorizeCard(cardId);
  const rows = await prisma.comment.findMany({ where: { contentItemId: cardId }, orderBy: { createdAt: "asc" } });
  return rows.map((c) => ({
    id: c.id, body: c.body, authorId: c.authorId, authorName: c.authorName, createdAt: c.createdAt.toISOString(),
  }));
}

export async function addComment(input: { cardId: string; body: string }) {
  const { cardId, body } = z
    .object({ cardId: z.string().min(1), body: z.string().trim().min(1).max(2000) })
    .parse(input);
  const { session } = await authorizeCard(cardId);

  const c = await prisma.comment.create({
    data: {
      body, contentItemId: cardId, workspaceId: session.workspaceId,
      authorId: session.member.id, authorName: session.member.name,
    },
  });
  revalidatePath("/board");
  return {
    ok: true as const,
    comment: { id: c.id, body: c.body, authorId: c.authorId, authorName: c.authorName, createdAt: c.createdAt.toISOString() },
  };
}

export async function deleteComment(input: { id: string }) {
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const session = await getSessionMember();
  if (!session?.workspaceId) throw new Error("Not authenticated");

  const c = await prisma.comment.findUnique({ where: { id }, select: { workspaceId: true, authorId: true } });
  if (!c || c.workspaceId !== session.workspaceId) throw new Error("Not found");
  // Authors remove their own comments; a super admin can remove any.
  if (c.authorId !== session.member.id && !session.member.isSuperAdmin) throw new Error("Not allowed");

  await prisma.comment.delete({ where: { id } });
  revalidatePath("/board");
  return { ok: true as const };
}
