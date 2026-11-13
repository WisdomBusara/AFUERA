import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionMember } from "@/lib/auth";
import { resolveAssetPath } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;

function kindFromMime(mime: string) {
  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("video/")) return "Video";
  return "Document";
}

// Stores one uploaded file on disk under the caller's workspace and records it.
export async function POST(req: NextRequest) {
  const s = await getSessionMember();
  if (!s?.workspaceId) return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });

  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "No file received." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "File is larger than 25 MB." }, { status: 413 });
  }

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "file";
  const rel = `${s.workspaceId}/${randomUUID()}-${safe}`;
  const full = resolveAssetPath(rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, Buffer.from(await file.arrayBuffer()));

  const mimeType = file.type || "application/octet-stream";
  const asset = await prisma.asset.create({
    data: {
      workspaceId: s.workspaceId,
      name: file.name.slice(0, 200),
      kind: kindFromMime(mimeType),
      mimeType,
      path: rel,
      size: file.size,
      uploaderId: s.member.id,
      uploaderName: s.member.name,
    },
  });

  revalidatePath("/assets");
  return NextResponse.json({
    ok: true,
    asset: { id: asset.id, name: asset.name, kind: asset.kind, mimeType, path: rel, size: asset.size, uploaderName: "You" },
  });
}
