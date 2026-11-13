"use server";

import { unlink } from "fs/promises";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionMember } from "@/lib/auth";
import { resolveAssetPath } from "@/lib/storage";

// Uploads are handled by POST /api/assets/upload (it writes the file and the row).

export async function deleteAsset(input: { id: string }) {
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const s = await getSessionMember();
  if (!s?.workspaceId) throw new Error("Not authenticated");

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset || asset.workspaceId !== s.workspaceId) throw new Error("Not found");

  // The file may already be gone; the row is what the UI lists.
  await unlink(resolveAssetPath(asset.path)).catch(() => {});
  await prisma.asset.delete({ where: { id } });

  revalidatePath("/assets");
  return { ok: true as const };
}
