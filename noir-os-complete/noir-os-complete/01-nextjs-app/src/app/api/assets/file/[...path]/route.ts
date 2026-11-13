import { readFile } from "fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionMember } from "@/lib/auth";
import { resolveAssetPath } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only these render in the browser. Everything else (HTML, SVG, PDFs…) is sent as a
// download so an uploaded file can never run script on this origin.
const INLINE = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "video/mp4", "video/webm"]);

// Serves an asset to members of the workspace that owns it.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const s = await getSessionMember();
  if (!s?.workspaceId) return new NextResponse("Unauthorized", { status: 401 });

  const rel = (await params).path.join("/");
  const asset = await prisma.asset.findFirst({ where: { workspaceId: s.workspaceId, path: rel } });
  if (!asset) return new NextResponse("Not found", { status: 404 });

  let data: Buffer;
  try {
    data = await readFile(resolveAssetPath(asset.path));
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const inline = INLINE.has(asset.mimeType);
  const filename = encodeURIComponent(asset.name);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": inline ? asset.mimeType : "application/octet-stream",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${filename}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
