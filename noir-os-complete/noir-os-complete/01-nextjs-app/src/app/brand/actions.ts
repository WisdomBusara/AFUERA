"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionMember } from "@/lib/auth";

const schema = z.object({
  colors: z.array(z.object({
    name: z.string().trim().min(1).max(40),
    hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colours must be 6-digit hex, e.g. #2E63F6"),
  })).max(12),
  fontDisplay: z.string().trim().max(80),
  fontBody: z.string().trim().max(80),
  voiceRules: z.array(z.object({
    title: z.string().trim().min(1).max(80),
    detail: z.string().trim().max(300),
  })).max(12),
  hashtags: z.array(z.string().trim().min(1).max(60)).max(30),
  legalDisclaimer: z.string().trim().max(1000),
  voiceSummary: z.string().trim().max(1500),
});

export type BrandKitInput = z.infer<typeof schema>;

// One kit per workspace: created on first save, replaced on later ones.
export async function saveBrandKit(input: BrandKitInput) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid brand kit." };

  const s = await getSessionMember();
  if (!s?.workspaceId) return { ok: false as const, error: "Not authenticated." };

  const data = {
    ...parsed.data,
    // "#" is added if missing so tags are stored one consistent way.
    hashtags: parsed.data.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)),
  };
  await prisma.brandKit.upsert({
    where: { workspaceId: s.workspaceId },
    create: { workspaceId: s.workspaceId, ...data },
    update: data,
  });

  revalidatePath("/brand");
  return { ok: true as const };
}
