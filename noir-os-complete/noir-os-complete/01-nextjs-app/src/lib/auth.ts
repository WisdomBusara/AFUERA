import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const PALETTE = ["#2E63F6", "#EC4899", "#8B5CF6", "#0EA5A4", "#F79009", "#12B76A"];

function nameFromEmail(email: string) {
  const local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return local.replace(/\b\w/g, (c) => c.toUpperCase()) || "Member";
}

export type SessionMember = {
  user: { id: string; email: string | null };
  member: {
    id: string;
    name: string;
    initials: string;
    color: string;
    role: string;
    workspaceId: string;
    workspace: { id: string; name: string; slug: string };
  };
  workspaceId: string;
};

/**
 * Resolves the current Supabase user to a Member row. On first login the user is
 * provisioned into the demo workspace so a fresh signup lands on the seeded board.
 * Returns null when there's no session.
 */
export async function getSessionMember(): Promise<SessionMember | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let member = await prisma.member.findUnique({
    where: { authUserId: user.id },
    include: { workspace: true },
  });

  if (!member) {
    const ws = await prisma.workspace.findFirst({ orderBy: { createdAt: "asc" } });
    if (!ws) {
      // Authenticated but nothing seeded — redirecting to /login would loop.
      throw new Error("No workspace found. Run `npm run db:seed` to create the demo workspace.");
    }
    const email = user.email ?? "member@afuera.app";
    const name = nameFromEmail(email);
    const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

    member = await prisma.member.create({
      data: { name, initials, color, role: "Member", online: true, authUserId: user.id, email: user.email ?? null, workspaceId: ws.id },
      include: { workspace: true },
    });
  }

  return {
    user: { id: user.id, email: user.email ?? null },
    member: {
      id: member.id,
      name: member.name,
      initials: member.initials,
      color: member.color,
      role: member.role,
      workspaceId: member.workspaceId,
      workspace: { id: member.workspace.id, name: member.workspace.name, slug: member.workspace.slug },
    },
    workspaceId: member.workspaceId,
  };
}

/** Same as getSessionMember but redirects to /login when unauthenticated. */
export async function requireMember(): Promise<SessionMember> {
  const s = await getSessionMember();
  if (!s) redirect("/login");
  return s;
}
