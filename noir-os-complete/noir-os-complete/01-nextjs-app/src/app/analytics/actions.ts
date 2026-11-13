"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionMember } from "@/lib/auth";

const count = z.number().int().min(0).max(1_000_000_000);

const logSchema = z
  .object({
    contentItemId: z.string().min(1),
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    impressions: count,
    reach: count,
    engagements: count,
    clicks: count,
  })
  .refine((m) => m.reach <= m.impressions || m.impressions === 0, {
    message: "Reach can't be higher than impressions.",
  });

/**
 * Records one day of performance for one content item. There is one row per
 * (item, day), so logging the same day again replaces the earlier numbers.
 */
export async function logMetric(input: z.infer<typeof logSchema>) {
  const parsed = logSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid numbers." };
  const { contentItemId, day, ...numbers } = parsed.data;

  const s = await getSessionMember();
  if (!s?.workspaceId) return { ok: false as const, error: "Not authenticated." };

  const item = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    select: { workspaceId: true, channel: true },
  });
  if (!item || item.workspaceId !== s.workspaceId) return { ok: false as const, error: "Content item not found." };

  const date = new Date(`${day}T00:00:00.000Z`);
  if (date.getTime() > Date.now()) return { ok: false as const, error: "That date is in the future." };

  const row = await prisma.dailyMetric.upsert({
    where: { contentItemId_date: { contentItemId, date } },
    create: { contentItemId, date, channel: item.channel, workspaceId: s.workspaceId, ...numbers },
    update: { ...numbers, channel: item.channel },
  });

  revalidatePath("/analytics");
  return { ok: true as const, id: row.id };
}

export async function deleteMetric(input: { id: string }) {
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const s = await getSessionMember();
  if (!s?.workspaceId) throw new Error("Not authenticated");

  const row = await prisma.dailyMetric.findUnique({ where: { id }, select: { workspaceId: true } });
  if (!row || row.workspaceId !== s.workspaceId) throw new Error("Not found");

  await prisma.dailyMetric.delete({ where: { id } });
  revalidatePath("/analytics");
  return { ok: true as const };
}
