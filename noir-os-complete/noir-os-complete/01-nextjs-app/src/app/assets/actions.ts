"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  kind: z.string().min(1).max(24),
  mimeType: z.string().min(1).max(120),
  path: z.string().min(1).max(400),
  size: z.number().int().nonnegative(),
});

// Called after the browser has uploaded the file to the Storage bucket.
export async function createAsset(input: z.infer<typeof createSchema>) {
  const data = createSchema.parse(input);
  const s = await getSessionMember();
  if (!s?.workspaceId) throw new Error("Not authenticated");

  // Paths are namespaced by workspace; reject anything outside the caller's prefix.
  if (!data.path.startsWith(`${s.workspaceId}/`)) throw new Error("Invalid path");

  const asset = await prisma.asset.create({
    data: {
      workspaceId: s.workspaceId,
      name: data.name,
      kind: data.kind,
      mimeType: data.mimeType,
      path: data.path,
      size: data.size,
      uploaderId: s.member.id,
      uploaderName: s.member.name,
    },
  });

  revalidatePath("/assets");
  return { ok: true as const, id: asset.id };
}

export async function deleteAsset(input: { id: string }) {
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const s = await getSessionMember();
  if (!s?.workspaceId) throw new Error("Not authenticated");

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset || asset.workspaceId !== s.workspaceId) throw new Error("Not found");

  const supabase = await createClient();
  await supabase.storage.from("assets").remove([asset.path]);
  await prisma.asset.delete({ where: { id } });

  revalidatePath("/assets");
  return { ok: true as const };
}
