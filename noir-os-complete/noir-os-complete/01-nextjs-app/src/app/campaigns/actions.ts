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

async function ensureOwned(id: string, workspaceId: string) {
  const c = await prisma.campaign.findUnique({ where: { id }, select: { workspaceId: true } });
  if (!c || c.workspaceId !== workspaceId) throw new Error("Not found");
}

function revalidate() {
  revalidatePath("/campaigns");
  revalidatePath("/board");
  revalidatePath("/dashboard");
}

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const isoDate = z.string().datetime().nullable().optional();

const createSchema = z.object({
  name: z.string().trim().min(1, "Add a name").max(120),
  color: hex.optional(),
  objective: z.string().trim().max(400).optional(),
  endDate: isoDate,
});

export async function createCampaign(input: z.infer<typeof createSchema>) {
  const data = createSchema.parse(input);
  const workspaceId = await requireWorkspace();
  const campaign = await prisma.campaign.create({
    data: {
      workspaceId,
      name: data.name,
      color: data.color ?? "#2E63F6",
      objective: data.objective ?? "",
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });
  revalidate();
  return { ok: true as const, id: campaign.id };
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  color: hex.optional(),
  objective: z.string().trim().max(400).optional(),
  endDate: isoDate,
});

export async function updateCampaign(input: z.infer<typeof updateSchema>) {
  const data = updateSchema.parse(input);
  const workspaceId = await requireWorkspace();
  await ensureOwned(data.id, workspaceId);
  await prisma.campaign.update({
    where: { id: data.id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
      ...(data.objective !== undefined ? { objective: data.objective } : {}),
      // Changing the end date re-arms the CAMPAIGN_ENDS automation for this campaign.
      ...(data.endDate !== undefined
        ? { endDate: data.endDate ? new Date(data.endDate) : null, endHandledAt: null }
        : {}),
    },
  });
  revalidate();
  return { ok: true as const };
}

export async function deleteCampaign(input: { id: string }) {
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const workspaceId = await requireWorkspace();
  await ensureOwned(id, workspaceId);

  // Deleting a campaign would cascade-delete its content, so refuse while it has any.
  const items = await prisma.contentItem.count({ where: { campaignId: id } });
  if (items > 0) {
    return {
      ok: false as const,
      error: `This campaign still has ${items} content item${items === 1 ? "" : "s"}. Delete or archive-and-delete them first.`,
    };
  }

  await prisma.campaign.delete({ where: { id } });
  revalidate();
  return { ok: true as const };
}
